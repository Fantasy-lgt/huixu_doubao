import fp from 'fastify-plugin';
import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  getSession,
  purgeExpiredSessions,
  SESSION_COOKIE_MAX_AGE_S,
} from '../services/session.service.js';

// Cookie 名固定 sid；HttpOnly、SameSite=Lax、path=/、7 天有效期；只存 sid 不存用户信息。
export const SESSION_COOKIE_NAME = 'sid';

// 本地 HTTP 不设 Secure；请求为 https 或 CORS_ORIGIN 指向非回环地址时才 Secure。
export function sessionCookieSecure(request: FastifyRequest): boolean {
  if (request.protocol === 'https') return true;
  const origins = (process.env.CORS_ORIGIN ?? 'http://127.0.0.1:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return origins.some((o) => !/localhost|127\.0\.0\.1/.test(o));
}

export function applySessionCookie(reply: FastifyReply, sid: string): void {
  reply.setCookie(SESSION_COOKIE_NAME, sid, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_COOKIE_MAX_AGE_S,
    secure: sessionCookieSecure(reply.request),
  });
}

export function clearSessionCookie(reply: FastifyReply): void {
  reply.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
}

export default fp(async (app) => {
  app.decorateRequest('currentUserId', null as string | null);

  app.decorate(
    'requireAuth',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await getSession(app.prisma, request.cookies[SESSION_COOKIE_NAME]);
      if (!session) {
        reply
          .code(401)
          .send({ error: { code: 'UNAUTHENTICATED', message: '登录已过期，请重新登录' } });
        return;
      }
      request.currentUserId = session.userId;
    }
  );

  // 启动时清理一次过期会话；本期不引入定时框架
  app.addHook('onReady', async () => {
    await purgeExpiredSessions(app.prisma).catch(() => undefined);
  });
});

declare module 'fastify' {
  interface FastifyRequest {
    currentUserId: string | null;
  }
  interface FastifyInstance {
    requireAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
