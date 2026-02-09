# LLM-Powered Document Extraction API

A small API that lets you upload documents, classify their type (invoice, purchase order, receipt, etc.), extract structured data using an LLM, store everything in Postgres, and query or ask questions about documents over HTTP.

---

## What it does

- **Upload** — Send a file (`.txt`, `.pdf`, or image) plus optional notes. The file is stored on disk and a record is created in the database.
- **Classification & extraction** — For text files, an LLM classifies the document type and extracts structured fields (parties, amounts, dates, line items, summary). For PDFs and images, only classification from filename and notes runs (no OCR). Results are validated and saved.
- **Storage** — Documents and extracted data live in PostgreSQL. File bytes live under `./uploads` on the server.
- **Retrieval** — List documents (paginated, with optional type filter and full-text search), fetch one by id, or ask free-form questions about a document; answers are generated from the stored extraction and raw text and saved as Q&A pairs.

**Components:** NestJS app (controllers, services, repositories), Prisma for the DB, OpenAI for the LLM, class-validator for request validation, Zod for LLM output validation, multer for file uploads.

---

## Stack

- **TypeScript**, **Node.js**, **Express**, **PostgreSQL** — API is built with NestJS (Express as the default HTTP server).
- **Prisma** — Schema and migrations.
- **OpenAI** — Classification, extraction, and Q&A.
- **Zod** — Validating LLM JSON before saving. **class-validator** + **ValidationPipe** — Request validation. **multer** — Multipart uploads.

---

## Setup

1. **Start Postgres**
   ```bash
   docker compose up -d
   ```
2. **Environment**
   ```bash
   cp .env.example .env
   ```
   Set `OPENAI_API_KEY` in `.env` (required for extraction and Q&A).
3. **Install and migrate**
   ```bash
   npm i
   npm run prisma:generate
   npm run prisma:migrate
   ```
4. **Run the server**
   ```bash
   npm run dev
   ```
   Server listens on `PORT` (default 3000).

---

## Migrations

- Run migrations: `npm run prisma:migrate`
- Migrations live in `prisma/migrations/`

---

## API reference

### Data model

- **Document** — One row per upload. Fields: `id`, `originalFilename`, `storagePath`, `mimeType`, `notes`, `status` (UPLOADED | PROCESSED | FAILED | NEEDS_TEXT), `docType` (INVOICE | PURCHASE_ORDER | RECEIPT | OTHER or null), `extractedData` (JSON), `rawText` (for `.txt` only), `extractedAt`, `createdAt`, `updatedAt`.
- **DocumentQuestion** — One row per Q&A. Fields: `id`, `documentId`, `question`, `answer`, `createdAt`.

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/documents` | Upload file (required), optional `notes`. Multipart form. |
| GET | `/documents` | List: `limit`, `offset`, `type` (invoice \| purchase_order \| receipt \| other), `q` (full-text search). |
| GET | `/documents/:id` | One document by id. |
| POST | `/documents/:id/questions` | Body: `{ "question": "..." }`. Creates Q&A, returns it. |

**Examples**

```bash
curl -X POST http://localhost:3000/documents -F "file=@/path/to/invoice.txt" -F "notes=Q1 2024"
curl "http://localhost:3000/documents?limit=10&offset=0"
curl "http://localhost:3000/documents?q=Acme"
curl http://localhost:3000/documents/<id>
curl -X POST http://localhost:3000/documents/<id>/questions -H "Content-Type: application/json" -d '{"question": "What is the total?"}'
```

**List response:** `{ "items": [...], "total": N, "limit": L, "offset": O }`. Single document and created question return the resource object.

### Errors

All errors use a stable shape: `{ "error": { "code": "...", "message": "..." } }` with 404 (`NOT_FOUND`), 400 (`VALIDATION_ERROR`, `INVALID_FILE_TYPE`), or 500 (`EXTRACTION_FAILED`, `INTERNAL_ERROR`).

---

## Design choices

- **Prisma** — Single place for schema and migrations; type-safe client and reproducible DB.
- **No OCR** — PDFs and images are classified from filename and notes only; status is set to NEEDS_TEXT. Full extraction runs only for text files.
- **Local uploads** — Files stored under `./uploads`. No S3 or blob storage.
- **Zod for LLM output** — LLM JSON is validated before save. On invalid output we retry once with a stricter prompt, then mark the document FAILED.
- **Full-text search** — List `q` uses Postgres `to_tsvector` / `plainto_tsquery` over filename, notes, and extractedData. Query-time only (no GIN index).
- **Input truncation** — Document text is capped (~15k chars) before sending to the LLM.
- **No auth** — API is unauthenticated; documents are global. Can be added later if needed.

---

## Tests

- **Unit:** `tests/llm.service.unit.test.ts` — LlmService with mocked OpenAI.
- **Integration:** `tests/documents.integration.test.ts` — Upload, list, get by id, validation, Q&A.

Requires Postgres and `.env` with `DATABASE_URL` and `OPENAI_API_KEY`.

```bash
npm test
```

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Run with ts-node-dev |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Run `node dist/server.js` |
| `npm test` | Jest |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run migrations |
