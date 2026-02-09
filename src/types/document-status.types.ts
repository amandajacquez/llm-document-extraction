/** Document status enum (matches Prisma). Single source of truth for DB/API. */
export const DOCUMENT_STATUS = {
  UPLOADED: 'UPLOADED',
  PROCESSED: 'PROCESSED',
  FAILED: 'FAILED',
  NEEDS_TEXT: 'NEEDS_TEXT',
} as const;

export type DocumentStatus = (typeof DOCUMENT_STATUS)[keyof typeof DOCUMENT_STATUS];
