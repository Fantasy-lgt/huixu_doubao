import type { FastifyPluginAsync } from 'fastify';
import { login, logout, me, register } from '../services/auth.service.js';
import {
  applySessionCookie,
  clearSessionCookie,
  SESSION_COOKIE_NAME,
} from '../plugins/auth.js';

// 认证路由（PRD-01 §5）：注册 201；登录成功种 Cookie；登出销毁会话并清 Cookie；/me 走守卫。
const auth: FastifyPluginAsync = async (app) => {
  app.post('/register', async (request, reply) => {
    const { user, session } = await register(app.prisma, request.body);
    applySessionCookie(reply, session.sid);
    reply.code(201).send({ data: user });
  });

  app.post('/login', async (request, reply) => {
    const { user, session } = await login(app.prisma, request.body);
    applySessionCookie(reply, session.sid);
    reply.send({ data: user });
  });

  app.post('/logout', async (request, reply) => {
    await logout(app.prisma, request.cookies[SESSION_COOKIE_NAME]);
    clearSessionCookie(reply);
    reply.send({ data: { ok: true } });
  });

  app.get('/me', { preHandler: [app.requireAuth] }, async (request, reply) => {
    const user = await me(app.prisma, request.currentUserId as string);
    reply.send({ data: user });
  });
};

export default auth;
