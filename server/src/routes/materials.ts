import type { FastifyPluginAsync } from 'fastify';

// 材料库路由占位（W2 实现）。契约来源：PRD-02-材料库、IA 对照表第 2.2 节、任务流 F1-2
const materials: FastifyPluginAsync = async (app) => {
  // GET /materials?type=&tag=&period=&keyword= 强制作用域 userId
  app.get('/', async (_req, reply) =>
    reply.code(501).send({ error: { code: 'NOT_IMPLEMENTED', message: 'W2：材料列表+组合筛选' } })
  );
  // GET /materials/:id 归属校验，不归属 → 404
  app.get('/:id', async (_req, reply) =>
    reply.code(501).send({ error: { code: 'NOT_IMPLEMENTED', message: 'W2：材料详情' } })
  );
  // POST /materials 期间+正文指纹去重；重复返回 409 MATERIAL_DUPLICATE
  app.post('/', async (_req, reply) =>
    reply.code(501).send({ error: { code: 'NOT_IMPLEMENTED', message: 'W2：新建材料（粘贴/TXT/MD）' } })
  );
  // PUT /materials/:id 原文只读，元信息可改；版本号自增
  app.put('/:id', async (_req, reply) =>
    reply.code(501).send({ error: { code: 'NOT_IMPLEMENTED', message: 'W2：更新材料元信息' } })
  );
  // DELETE /materials/:id 二次确认；引用草稿联动标待重核
  app.delete('/:id', async (_req, reply) =>
    reply.code(501).send({ error: { code: 'NOT_IMPLEMENTED', message: 'W2：删除材料并联动失效提示' } })
  );
};

export default materials;
