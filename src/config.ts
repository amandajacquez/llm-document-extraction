import 'dotenv/config';

// Chat model for extraction and Q&A. gpt-4o-mini: good balance of cost and quality. Alternatives: 'gpt-4o' | 'gpt-4-turbo' | 'gpt-4' | 'gpt-3.5-turbo'
const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL ?? 'gpt-4o-mini';

export const config = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  databaseUrl: process.env.DATABASE_URL ?? '',
  openaiApiKey: process.env.OPENAI_API_KEY ?? '',
  uploadsDir: process.env.UPLOADS_DIR ?? './uploads',
  maxTextLengthForExtraction: 15_000,
  maxUploadBytes: 10 * 1024 * 1024, // 10 MB
  chatModel: CHAT_MODEL,
} as const;
