/**
 * Input for updating a document (partial; only provided fields are updated).
 * Use toPrismaJson from utils/prisma for extractedData when passing to the repository.
 */
export interface UpdateDocumentDto {
  status?: string;
  docType?: string | null;
  extractedData?: object;
  rawText?: string | null;
  extractedAt?: Date | null;
}
