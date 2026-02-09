/** Persistence shape: what we get from Prisma/DB. Mapped to Document entity by the repository. */
export type DocumentRecord = {
  id: string;
  originalFilename: string;
  storagePath: string;
  mimeType: string;
  notes: string | null;
  status: string;
  docType: string | null;
  extractedData: unknown;
  rawText: string | null;
  extractedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
