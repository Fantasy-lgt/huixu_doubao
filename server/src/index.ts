import 'dotenv/config';
import { buildApp } from './app';

const PORT = Number(process.env.PORT ?? 3001);

async function main() {
  const app = await buildApp();
  await app.listen({ port: PORT, host: '0.0.0.0' });
  app.log.info(`huixu-server listening on http://127.0.0.1:${PORT}`);
}

main().catch((err) => {
  console.error('server failed to start:', err);
  process.exit(1);
});
