// 方案甲：服务端 Session 存 PostgreSQL（sessions 表），Cookie 只存 sid（PRD-01 §4.3）。
import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 天
export const SESSION_COOKIE_MAX_AGE_S = 7 * 24 * 60 * 60;

export interface SessionRecord {
  sid: string;
  userId: string;
  expiresAt: Date;
}

export async function createSession(
  prisma: PrismaClient,
  userId: string
): Promise<SessionRecord> {
  const sid = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const row = await prisma.session.create({
    data: { sid, userId, expiresAt },
    select: { sid: true, userId: true, expiresAt: true },
  });
  return row;
}

// 过期会话读取时即删除并返回 null；不把过期行交给上层
export async function getSession(
  prisma: PrismaClient,
  sid: string | undefined
): Promise<SessionRecord | null> {
  if (!sid) return null;
  const row = await prisma.session.findUnique({
    where: { sid },
    select: { sid: true, userId: true, expiresAt: true },
  });
  if (!row) return null;
  if (row.expiresAt.getTime() <= Date.now()) {
    await prisma.session.deleteMany({ where: { sid } }).catch(() => undefined);
    return null;
  }
  return row;
}

export async function destroySession(
  prisma: PrismaClient,
  sid: string | undefined
): Promise<void> {
  if (sid) await prisma.session.deleteMany({ where: { sid } });
}

// 启动时清理一次过期行；本期不引入定时框架（PRD-01 §8.3 备注）
export async function purgeExpiredSessions(
  prisma: PrismaClient
): Promise<{ count: number }> {
  return prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}
