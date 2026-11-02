// 材料库服务（PRD-02 §3、§5、§6）。所有查询强制 userId 作用域；
// 查重按 userId + period + 正文指纹在事务内比对（本期不加指纹列、不建唯一索引）。
import type { Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';
import { fail } from '../domain/errors.js';
import { fingerprint } from '../domain/fingerprint.js';
import { validateMaterialPayload, type MaterialPayload } from '../validators/material.validator.js';

export interface MaterialListQuery {
  materialType?: string;
  period?: string;
  tag?: string;
  keyword?: string;
}

function notFound(): never {
  fail('材料不存在或无权访问', 404, 'NOT_FOUND');
}

export async function createMaterial(
  prisma: PrismaClient,
  userId: string,
  body: unknown
) {
  const input: MaterialPayload = validateMaterialPayload(body);
  const fp = fingerprint(input.body);

  return prisma.$transaction(async (tx) => {
    const candidates = await tx.material.findMany({
      where: { userId, period: input.period },
      select: { body: true },
    });
    if (candidates.some((c) => fingerprint(c.body) === fp)) {
      fail('内容与已有材料重复（同期间正文一致）', 409, 'MATERIAL_DUPLICATE');
    }
    return tx.material.create({
      data: {
        userId,
        title: input.title,
        materialType: input.materialType,
        tags: input.tags,
        period: input.period,
        occasion: input.occasion,
        body: input.body,
        sourceName: input.sourceName,
      },
    });
  });
}

export async function listMaterials(
  prisma: PrismaClient,
  userId: string,
  query: MaterialListQuery
) {
  const where: Prisma.MaterialWhereInput = { userId };
  if (query.materialType) where.materialType = query.materialType;
  if (query.period) where.period = query.period;
  if (query.tag) where.tags = { has: query.tag };
  if (query.keyword) {
    const kw = query.keyword;
    where.OR = [
      { title: { contains: kw, mode: 'insensitive' } },
      { body: { contains: kw, mode: 'insensitive' } },
      { sourceName: { contains: kw, mode: 'insensitive' } },
    ];
  }
  return prisma.material.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      materialType: true,
      tags: true,
      period: true,
      occasion: true,
      sourceName: true,
      version: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getMaterial(prisma: PrismaClient, userId: string, id: string) {
  const row = await prisma.material.findFirst({ where: { id, userId } });
  if (!row) notFound();
  return row;
}

export async function updateMaterial(
  prisma: PrismaClient,
  userId: string,
  id: string,
  body: unknown
) {
  const existing = await prisma.material.findFirst({ where: { id, userId } });
  if (!existing) notFound();

  const input: MaterialPayload = validateMaterialPayload(body);
  const fp = fingerprint(input.body);

  return prisma.$transaction(async (tx) => {
    const candidates = await tx.material.findMany({
      where: { userId, period: input.period, NOT: { id } },
      select: { body: true },
    });
    if (candidates.some((c) => fingerprint(c.body) === fp)) {
      fail('内容与已有材料重复（同期间正文一致）', 409, 'MATERIAL_DUPLICATE');
    }
    return tx.material.update({
      where: { id },
      data: {
        title: input.title,
        materialType: input.materialType,
        tags: input.tags,
        period: input.period,
        occasion: input.occasion,
        body: input.body,
        sourceName: input.sourceName,
        version: { increment: 1 },
      },
    });
  });
}

export async function deleteMaterial(prisma: PrismaClient, userId: string, id: string) {
  const existing = await prisma.material.findFirst({ where: { id, userId } });
  if (!existing) notFound();
  await prisma.material.delete({ where: { id } });
  return { id };
}
