import type { DocumentStatus } from '../types/document-status.types';
import type { DocumentType } from '../types/document-type.types';

/** Document as returned by the API (DTO). */
export type DocumentResponse = {
  id: string;
  originalFilename: string;
  storagePath: string;
  mimeType: string;
  notes: string | null;
  status: DocumentStatus;
  docType: DocumentType | null;
  extractedData: unknown;
  rawText: string | null;
  extractedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
