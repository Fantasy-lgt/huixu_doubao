import fp from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';

// 单一 Prisma 客户端实例；未配置 DATABASE_URL 时惰性不报错，健康检查可独立运行
export const prisma = new PrismaClient();

export default fp(async (app) => {
  app.decorate('prisma', prisma);
  app.addHook('onClose', async () => {
    await prisma.$disconnect();
  });
});

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}
