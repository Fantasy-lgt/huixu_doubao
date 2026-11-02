import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import prismaPlugin from './plugins/prisma';
import authPlugin from './plugins/auth';
import health from './routes/health';
import authRoutes from './routes/auth';
import materialRoutes from './routes/materials';
import { AppError } from './domain/errors.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });

  // 统一错误响应必须先于子路由注册，保证所有路由共享同一错误处理器（Fastify 封装继承顺序）。
  // 领域 AppError 带 status/code 原样映射；schema 校验错误归 400；其余未知错误兜底 500；
  // 细节只进服务端日志，不进响应体（不回堆栈/SQL/密钥）。
  app.setErrorHandler((error, request, reply) => {
    app.log.error({ err: error, method: request.method, url: request.url }, 'request failed');
    if (error instanceof AppError) {
      return reply.code(error.status).send({
        error: { code: error.code, message: error.message },
      });
    }
    if (error.validation) {
      return reply.code(400).send({
        error: { code: 'VALIDATION_FAILED', message: '请求参数格式有误' },
      });
    }
    return reply.code(500).send({
      error: { code: 'SERVER_ERR', message: '服务暂时不可用' },
    });
  });

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

  return app;
}
