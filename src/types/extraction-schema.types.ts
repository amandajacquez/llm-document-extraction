import { z } from 'zod';

export const extractionSchema = z.object({
  docType: z.enum(['invoice', 'purchase_order', 'receipt', 'other']),
  confidence: z.number().min(0).max(1),
  parties: z.object({
    vendor: z.string().nullable(),
    customer: z.string().nullable(),
  }),
  identifiers: z.object({
    invoiceNumber: z.string().nullable(),
    poNumber: z.string().nullable(),
  }),
  amounts: z.object({
    subtotal: z.number().nullable(),
    tax: z.number().nullable(),
    total: z.number().nullable(),
    currency: z.string().nullable(),
  }),
  dates: z.object({
    issuedDate: z.string().nullable(),
    dueDate: z.string().nullable(),
  }),
  lineItems: z
    .array(
      z.object({
        description: z.string().nullable(),
        quantity: z.number().nullable(),
        unitPrice: z.number().nullable(),
        amount: z.number().nullable(),
      })
    )
    .nullable(),
  summary: z.string(),
  rawNotes: z.string().nullable(),
});

export type ExtractedData = z.infer<typeof extractionSchema>;

export const EXTRACTION_SYSTEM = `You are a document extraction assistant. Output ONLY valid JSON matching this exact schema (no markdown, no prose):
{
  "docType": "invoice" | "purchase_order" | "receipt" | "other",
  "confidence": number between 0 and 1,
  "parties": { "vendor": string|null, "customer": string|null },
  "identifiers": { "invoiceNumber": string|null, "poNumber": string|null },
  "amounts": { "subtotal": number|null, "tax": number|null, "total": number|null, "currency": string|null },
  "dates": { "issuedDate": string|null (YYYY-MM-DD or null), "dueDate": string|null (YYYY-MM-DD or null) },
  "lineItems": [ { "description": string|null, "quantity": number|null, "unitPrice": number|null, "amount": number|null } ] | null,
  "summary": string (brief summary),
  "rawNotes": string|null
}`;

export function buildExtractionUserPrompt(text: string, filename: string, notes: string): string {
  return `Extract structured data from this document.\nFilename: ${filename}\nNotes: ${notes || '(none)'}\n\nDocument text:\n${text}`;
}

export function buildStrictRetryUserPrompt(rawText: string): string {
  return `Output ONLY a single JSON object. No markdown code blocks, no explanation. Valid JSON only:\n\n${rawText}`;
}
