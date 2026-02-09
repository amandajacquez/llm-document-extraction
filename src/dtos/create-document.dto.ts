/**
 * Document creation DTOs.
 * CreateDocumentDto = what the service passes to the repo (upload metadata only).
 * DocumentCreatePayloadDto = what the repo sends to Prisma (adds status, docType); kept here because it extends CreateDocumentDto.
 */
export interface CreateDocumentDto {
  originalFilename: string;
  storagePath: string;
  mimeType: string;
  notes: string | null;
}

export interface DocumentCreatePayloadDto extends CreateDocumentDto {
  status: string;
  docType: null;
}
