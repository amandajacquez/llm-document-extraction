/** Document type enum (matches Prisma). Single source of truth for DB/API. */
export const DOCUMENT_TYPE = {
  INVOICE: 'INVOICE',
  PURCHASE_ORDER: 'PURCHASE_ORDER',
  RECEIPT: 'RECEIPT',
  OTHER: 'OTHER',
} as const;

export type DocumentType = (typeof DOCUMENT_TYPE)[keyof typeof DOCUMENT_TYPE];

/** Maps LLM extraction docType (snake_case) to DocumentType. */
export const DOC_TYPE_MAP: Record<string, DocumentType> = {
  invoice: DOCUMENT_TYPE.INVOICE,
  purchase_order: DOCUMENT_TYPE.PURCHASE_ORDER,
  receipt: DOCUMENT_TYPE.RECEIPT,
  other: DOCUMENT_TYPE.OTHER,
};

export function toDocumentType(docType: string): DocumentType {
  return DOC_TYPE_MAP[docType] ?? DOCUMENT_TYPE.OTHER;
}
