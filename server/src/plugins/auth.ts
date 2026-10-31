import fp from 'fastify-plugin';

// 鉴权守卫占位：W2 用 HttpOnly Cookie Session 落地。
// 合同（对应 PRD-01 与 IA 守卫四态）：
// 1. requiresAuth 路由先取会话用户；无/失效 → 401 UNAUTHENTICATED，前端跳 /login?redirect=
// 2. 业务查询强制注入 userId；资源不存在或不归属 → 404 NOT_FOUND
// 3. 越权用例：A 账号访问 B 资源必须被拒（W2 自动测试覆盖）
// 当前阶段仅提供签名与占位，不做真实校验，避免在无数据库时空转。
export default fp(async (app) => {
  app.decorateRequest('currentUserId', null as string | null);

  app.decorate('requireAuth', async (request: any, reply: any) => {
    // TODO(W2): 读取 Cookie Session → 查 users；失败 reply.code(401).send({ error: { code: 'UNAUTHENTICATED', message: '登录已过期，请重新登录' } })
    if (!request.currentUserId) {
      reply.code(401).send({ error: { code: 'UNAUTHENTICATED', message: '未登录（占位实现，W2 接 Session）' } });
    }
  });
});

declare module 'fastify' {
  interface FastifyRequest {
    currentUserId: string | null;
  }
  interface FastifyInstance {
    requireAuth: (request: any, reply: any) => Promise<void>;
  }
}
