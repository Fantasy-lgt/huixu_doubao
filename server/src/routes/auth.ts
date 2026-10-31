import type { FastifyPluginAsync } from 'fastify';

// 认证路由占位（W2 实现）。契约来源：PRD-01-账号与数据隔离、IA 对照表第 2.1 节
const auth: FastifyPluginAsync = async (app) => {
  // POST /auth/register 邮箱+密码（bcrypt/argon2 哈希），注册成功自动登录种 HttpOnly Cookie
  app.post('/register', async (_req, reply) =>
    reply.code(501).send({ error: { code: 'NOT_IMPLEMENTED', message: 'W2：注册并种 Session' } })
  );
  // POST /auth/login 校验密码，写 Session；失败不区分“用户不存在/密码错”，统一 401
  app.post('/login', async (_req, reply) =>
    reply.code(501).send({ error: { code: 'NOT_IMPLEMENTED', message: 'W2：登录并种 Session' } })
  );
  // POST /auth/logout 销毁服务端 Session 并清 Cookie
  app.post('/logout', async (_req, reply) =>
    reply.code(501).send({ error: { code: 'NOT_IMPLEMENTED', message: 'W2：退出登录' } })
  );
  // GET /me 主壳守卫前置调用；401 时前端跳 /login?redirect=
  app.get('/me', async (_req, reply) =>
    reply.code(501).send({ error: { code: 'NOT_IMPLEMENTED', message: 'W2：返回当前用户' } })
  );
};

export default auth;
