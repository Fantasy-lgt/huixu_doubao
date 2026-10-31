import type { FastifyPluginAsync } from 'fastify';

const health: FastifyPluginAsync = async (app) => {
  app.get('/health', async () => ({
    status: 'ok',
    service: 'huixu-server',
    time: new Date().toISOString(),
    dbConnected: Boolean(process.env.DATABASE_URL),
    aiConfigured: Boolean(process.env.MODEL_KEY),
  }));
};

export default health;
