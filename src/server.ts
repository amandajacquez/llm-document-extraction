import 'reflect-metadata';
import { config } from './config';
import { ensureUploadsDir } from './utils/files';
import { createApp } from './app';

async function bootstrap() {
  ensureUploadsDir();
  const app = await createApp();
  await app.listen(config.port);
  console.log(`Server listening on port ${config.port}`);
}

bootstrap();
