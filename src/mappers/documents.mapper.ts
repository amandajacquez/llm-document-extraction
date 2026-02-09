import type { DocumentResponse } from '../dtos';
import type { Document } from '../interfaces';
import type { DocumentStatus, DocumentType } from '../types/documents.types';

export function toDocumentResponse(doc: Document): DocumentResponse {
  return {
    id: doc.id,
    originalFilename: doc.originalFilename,
    storagePath: doc.storagePath,
    mimeType: doc.mimeType,
    notes: doc.notes,
    status: doc.status as DocumentStatus,
    docType: doc.docType as DocumentType | null,
    extractedData: doc.extractedData,
    rawText: doc.rawText,
    extractedAt: doc.extractedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
