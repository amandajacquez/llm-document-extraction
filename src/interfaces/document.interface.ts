/** Domain entity shape: a document as used by the rest of the app. */
export interface Document {
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
}
