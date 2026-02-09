import { Injectable } from '@nestjs/common';
import { Document } from '../entities/document.entity';
import type {
  CreateDocumentDto,
  DocumentCreatePayloadDto,
  UpdateDocumentDto,
} from '../dtos';
import type { DocumentRecord } from '../types/document-record.types';
import { BaseRepository, type BaseRepositoryDelegate, type FindManyArgs } from './base.repository';
import { PrismaService } from '../prisma.service';

/**
 * Repository for Document: persistence and lookup.
 * Uses entity createFromDto/toCreatePayload; extends Prisma base.
 */
@Injectable()
export class DocumentRepository extends BaseRepository<
  DocumentRecord,
  DocumentCreatePayloadDto,
  UpdateDocumentDto
> {
  constructor(private readonly prisma: PrismaService) {
    super(
      prisma.document as unknown as BaseRepositoryDelegate<
        DocumentRecord,
        DocumentCreatePayloadDto,
        UpdateDocumentDto
      >
    );
  }

  async createDocument(dto: CreateDocumentDto): Promise<Document> {
    const entity = Document.createFromDto(dto);
    const record = await this.create(entity.toCreatePayload());
    return Document.fromRecord(record);
  }

  async updateDocument(id: string, data: UpdateDocumentDto): Promise<Document> {
    const record = await this.update(id, data);
    return Document.fromRecord(record);
  }

  /** Get a document by id, or null if not found. */
  async getDocumentById(id: string): Promise<Document | null> {
    const record = await this.findById(id);
    return record ? Document.fromRecord(record) : null;
  }

  /** Get a document by id; throws if not found. */
  async getDocumentByIdOrThrow(id: string): Promise<Document> {
    const record = await this.findById(id);
    if (!record) throw new Error(`Document not found: ${id}`);
    return Document.fromRecord(record);
  }

  /** List documents with optional where, orderBy, take, skip. */
  async findManyDocuments(args?: FindManyArgs): Promise<Document[]> {
    const records = await this.findMany(args);
    return records.map((r) => Document.fromRecord(r));
  }

  /** Count documents, optionally with a where clause. */
  async countDocuments(where?: unknown): Promise<number> {
    return this.count(where);
  }

  /**
   * Full-text search over originalFilename, notes, and extractedData.
   * Returns document ids that match the query (English text search). Empty array if no query or no matches.
   */
  async searchDocumentIdsByFullText(query: string): Promise<string[]> {
    const normalized = query.trim().replace(/\s+/g, ' ').slice(0, 500);
    if (!normalized) return [];

    // Raw SQL: Prisma has no API for PostgreSQL full-text search. This returns document ids whose
    // filename, notes, or extractedData match the search text (English FTS: to_tsvector tokenizes
    // the combined text, plainto_tsquery turns the user query into a search expression, @@ matches).
    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Document"
      WHERE to_tsvector('english',
        coalesce("originalFilename", '') || ' ' ||
        coalesce("notes", '') || ' ' ||
        coalesce("extractedData"::text, '')
      ) @@ plainto_tsquery('english', ${normalized})
    `;
    return rows.map((r: { id: string }) => r.id);
  }

  /**
   * Create or update a document by id (Prisma upsert).
   * Use when you have an id and want to ensure the row exists.
   */
  async upsertDocument(
    id: string,
    create: DocumentCreatePayloadDto,
    update: UpdateDocumentDto
  ): Promise<Document> {
    const record = await this.upsert(id, create, update);
    return Document.fromRecord(record);
  }
}
