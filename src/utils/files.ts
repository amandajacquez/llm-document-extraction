import path from 'path';
import fs from 'fs';

export const UPLOADS_DIR = process.env.UPLOADS_DIR ?? './uploads';

/** Safe filename: no path traversal, unique. */
export function generateSafeStoragePath(originalFilename: string): string {
  const ext = path.extname(originalFilename) || '';
  const base = path.basename(originalFilename, ext).replace(/[^a-zA-Z0-9_-]/g, '_') || 'file';
  const safeBase = base.slice(0, 100);  // max basename length before unique suffix
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;  // 8-char random
  return `${safeBase}-${unique}${ext}`.toLowerCase();
}

/** Resolve storage path under uploads dir; prevent path traversal. */
export function resolveStoragePath(relativePath: string): string {
  const normalized = path.normalize(relativePath);
  if (normalized.startsWith('..') || path.isAbsolute(normalized)) {
    throw new Error('Invalid storage path');
  }
  return path.join(UPLOADS_DIR, normalized);
}

/** Ensure uploads directory exists. */
export function ensureUploadsDir(): void {
  const dir = path.resolve(UPLOADS_DIR);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export const ALLOWED_EXTENSIONS = new Set(['.txt', '.pdf', '.png', '.jpg', '.jpeg']);
export const TEXT_PLAIN = 'text/plain';

export function isTextPlain(mimeType: string): boolean {
  return mimeType === TEXT_PLAIN;
}
