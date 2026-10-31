import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import prismaPlugin from './plugins/prisma';
import authPlugin from './plugins/auth';
import health from './routes/health';
import authRoutes from './routes/auth';
import materialRoutes from './routes/materials';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://127.0.0.1:5173'],
    credentials: true,
  });
  await app.register(cookie);
  await app.register(prismaPlugin);
  await app.register(authPlugin);

  await app.register(health);
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(materialRoutes, { prefix: '/api/materials' });

  // 统一错误响应兜底
  app.setErrorHandler((error, _req, reply) => {
    app.log.error(error);
    reply.code(error.statusCode ?? 500).send({
      error: { code: 'SERVER_ERR', message: '服务暂时不可用' },
    });
  });

  return app;
}
