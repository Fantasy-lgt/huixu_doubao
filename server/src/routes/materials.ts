import type { FastifyPluginAsync } from 'fastify';
import {
  createMaterial,
  deleteMaterial,
  getMaterial,
  listMaterials,
  updateMaterial,
} from '../services/material.service.js';

// 材料库路由（PRD-02 §5）：整组 requireAuth；服务端强制 userId 作用域；
// 资源不存在或不归属统一 404 NOT_FOUND，不暴露存在性。
const materials: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', app.requireAuth);

  app.get('/', async (request, reply) => {
    const query = request.query as {
      materialType?: string;
      period?: string;
      tag?: string;
      keyword?: string;
    };
    const rows = await listMaterials(app.prisma, request.currentUserId as string, query);
    reply.send({ data: rows });
  });

  app.post('/', async (request, reply) => {
    const row = await createMaterial(app.prisma, request.currentUserId as string, request.body);
    reply.code(201).send({ data: row });
  });

  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const row = await getMaterial(app.prisma, request.currentUserId as string, id);
    reply.send({ data: row });
  });

  app.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const row = await updateMaterial(app.prisma, request.currentUserId as string, id, request.body);
    reply.send({ data: row });
  });

  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await deleteMaterial(app.prisma, request.currentUserId as string, id);
    reply.send({ data: { id } });
  });
};

export default materials;
