// 账号注册/登录/退出/当前用户（PRD-01 §3）。
// 哈希选型：argon2 v0.45.1，显式 argon2id、默认参数、异步 hash/verify；绝不存明文。
import argon2 from 'argon2';
import type { PrismaClient } from '@prisma/client';
import { fail } from '../domain/errors.js';
import { validateLogin, validateRegister } from '../validators/auth.validator.js';
import { createSession, destroySession, type SessionRecord } from './session.service.js';

export interface PublicUser {
  id: string;
  email: string;
  emailPrefix: string;
  plan: string;
  createdAt: Date;
}

function toPublic(user: {
  id: string;
  email: string;
  plan: string;
  createdAt: Date;
}): PublicUser {
  return {
    id: user.id,
    email: user.email,
    emailPrefix: user.email.split('@')[0] ?? user.email,
    plan: user.plan,
    createdAt: user.createdAt,
  };
}

function isUniqueEmailConflict(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === 'P2002';
}

export async function register(
  prisma: PrismaClient,
  body: unknown
): Promise<{ user: PublicUser; session: SessionRecord }> {
  const { email, password } = validateRegister(body);
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  try {
    const user = await prisma.user.create({
      data: { email, passwordHash, plan: 'free', status: 'active' },
      select: { id: true, email: true, plan: true, createdAt: true },
    });
    const session = await createSession(prisma, user.id);
    return { user: toPublic(user), session };
  } catch (err) {
    if (isUniqueEmailConflict(err)) {
      fail('该邮箱已注册，可直接登录', 409, 'EMAIL_TAKEN');
    }
    throw err;
  }
}

export async function login(
  prisma: PrismaClient,
  body: unknown
): Promise<{ user: PublicUser; session: SessionRecord }> {
  const { email, password } = validateLogin(body);
  const user = await prisma.user.findUnique({ where: { email } });
  let matched = false;
  if (user) {
    matched = await argon2.verify(user.passwordHash, password).catch(() => false);
  }
  // 用户不存在与密码错误统一 401 同文案，防止账号枚举（PRD-01 FR-A02）
  if (!user || !matched) {
    fail('邮箱或密码不正确', 401, 'INVALID_CREDENTIALS');
  }
  if (user.status !== 'active') {
    fail('账号不可用，请联系支持', 403, 'ACCOUNT_DISABLED');
  }
  const session = await createSession(prisma, user.id);
  return { user: toPublic(user), session };
}

export async function logout(prisma: PrismaClient, sid: string | undefined): Promise<void> {
  await destroySession(prisma, sid);
}

export async function me(prisma: PrismaClient, userId: string): Promise<PublicUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, plan: true, createdAt: true },
  });
  if (!user) fail('登录已过期，请重新登录', 401, 'UNAUTHENTICATED');
  return toPublic(user);
}
