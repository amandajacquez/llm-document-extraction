import { Injectable } from '@nestjs/common';
import fs from 'fs/promises';
import path from 'path';
import type { DocumentResponse } from '../dtos';
import type { AskQuestionDto } from '../dtos/ask-question.dto';
import type { ListDocumentsQueryDto } from '../dtos/list-documents-query.dto';
import { toDocumentResponse } from '../mappers/documents.mapper';
import { toDocumentQuestionResponse } from '../mappers/document-question.mapper';
import { DocumentQuestionRepository } from '../repositories/document-question.repository';
import { DocumentRepository } from '../repositories/document.repository';
import { DOCUMENT_STATUS, DOCUMENT_TYPE, toDocumentType, type DocumentType } from '../types/documents.types';

/** Filters for list endpoint: optional docType and optional id list from full-text search. */
interface ListDocumentsFilters {
  docType?: string;
  id?: { in: string[] };
}
import { createApiError } from '../utils/errors';
import {
  generateSafeStoragePath,
  ensureUploadsDir,
  isTextPlain,
  ALLOWED_EXTENSIONS,
  UPLOADS_DIR,
} from '../utils/files';
import { toPrismaJson } from '../utils/prisma';
import { LlmService } from './llm.service';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly docRepository: DocumentRepository,
    private readonly questionRepository: DocumentQuestionRepository,
    private readonly llm: LlmService,
  ) {}

  // Validates file and body, saves the file and creates the document row, runs LLM extraction (full for text, classification-only for images), then returns the updated document.
  async createDocument(params: { file?: Express.Multer.File; body?: { notes?: string } }): Promise<DocumentResponse> {
    const { file, notes } = this.validateFileAndParseNotes(params);
    const doc = await this.saveFileAndCreateInitialDocument(file, notes);

    if (isTextPlain(file.mimetype)) {
      await this.processTextDocumentExtraction(doc.id, file, notes);
    } else {
      await this.processImageDocumentExtraction(doc.id, file, notes);
    }

    const updated = await this.docRepository.getDocumentByIdOrThrow(doc.id);
    return toDocumentResponse(updated);
  }

  // Builds filters from query (optional doc type and optional full-text search), fetches the page and total count in parallel, returns items with pagination.
  async listDocuments(query: ListDocumentsQueryDto) {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;
    const filters = await this.buildListFilters(query);

    const [items, total] = await Promise.all([
      this.docRepository.findManyDocuments({
        where: filters,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.docRepository.countDocuments(filters),
    ]);

    return {
      items: items.map(toDocumentResponse),
      total,
      limit,
      offset,
    };
  }

  // Fetches a single document by id. Throws 404 if not found.
  async getDocumentById(id: string): Promise<DocumentResponse> {
    const doc = await this.docRepository.getDocumentById(id);
    if (!doc) {
      throw createApiError('Document not found', { statusCode: 404, code: 'NOT_FOUND' });
    }
    return toDocumentResponse(doc);
  }

  // Loads the document, gets an answer from the LLM, saves the question and answer, returns the new document question.
  async addQuestion(documentId: string, body: AskQuestionDto) {
    const doc = await this.docRepository.getDocumentById(documentId);
    if (!doc) {
      throw createApiError('Document not found', { statusCode: 404, code: 'NOT_FOUND' });
    }

    const answer = await this.llm.answerQuestion({
      extractedData: doc.extractedData,
      rawText: doc.rawText,
      question: body.question,
    });

    const questionEntity = await this.questionRepository.createQuestion({
      documentId,
      question: body.question,
      answer,
    });
    return toDocumentQuestionResponse(questionEntity);
  }

  // Builds the filter object for list/count: optional docType and optional id list from full-text search.
  private async buildListFilters(query: ListDocumentsQueryDto): Promise<ListDocumentsFilters> {
    const filters: ListDocumentsFilters = {};
    if (query.type) {
      const docType = query.type.toUpperCase() as DocumentType;
      if (Object.values(DOCUMENT_TYPE).includes(docType)) {
        filters.docType = docType;
      }
    }
    if (query.q?.trim()) {
      const ids = await this.docRepository.searchDocumentIdsByFullText(query.q);
      // Empty id list means no matches. Prisma still needs { in: [] } so we do not return everything.
      filters.id = { in: ids };
    }
    return filters;
  }

  // Checks that a file was uploaded and parses optional notes from the request body.
  private validateFileAndParseNotes(params: {
    file?: Express.Multer.File;
    body?: { notes?: string };
  }): { file: Express.Multer.File; notes: string | null } {
    if (!params.file) {
      throw createApiError('file is required', { statusCode: 400, code: 'VALIDATION_ERROR' });
    }
    const notes =
      params.body?.notes != null && String(params.body.notes).trim()
        ? String(params.body.notes).trim()
        : null;
    return { file: params.file, notes };
  }

  // Checks file extension, writes the file to disk, and creates the initial document row with status UPLOADED.
  private async saveFileAndCreateInitialDocument(
    file: Express.Multer.File,
    notes: string | null,
  ) {
    ensureUploadsDir();

    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      throw createApiError('Invalid file type', { statusCode: 400, code: 'INVALID_FILE_TYPE' });
    }

    const storagePath = generateSafeStoragePath(file.originalname);
    const fullPath = path.resolve(UPLOADS_DIR, storagePath);
    await fs.writeFile(fullPath, file.buffer);

    return this.docRepository.createDocument({
      originalFilename: file.originalname,
      storagePath,
      mimeType: file.mimetype,
      notes,
    });
  }

  // For text files: runs full extraction on the content and updates the document to PROCESSED, or FAILED if extraction throws.
  private async processTextDocumentExtraction(
    documentId: string,
    file: Express.Multer.File,
    notes: string | null,
  ): Promise<void> {
    const rawText = file.buffer.toString('utf-8');
    try {
      const extracted = await this.llm.classifyAndExtract({
        filename: file.originalname,
        notes: notes ?? '',
        text: rawText,
      });
      await this.docRepository.updateDocument(documentId, {
        status: DOCUMENT_STATUS.PROCESSED,
        docType: toDocumentType(extracted.docType),
        extractedData: toPrismaJson(extracted as object),
        rawText,
        extractedAt: new Date(),
      });
    } catch {
      await this.docRepository.updateDocument(documentId, { status: DOCUMENT_STATUS.FAILED });
      throw createApiError('Document processing failed', { statusCode: 500, code: 'EXTRACTION_FAILED' });
    }
  }

  // For non-text files, classifies from filename and notes only. On success updates to NEEDS_TEXT with the type. On error still marks NEEDS_TEXT with type OTHER and placeholder data.
  private async processImageDocumentExtraction(
    documentId: string,
    file: Express.Multer.File,
    notes: string | null,
  ): Promise<void> {
    try {
      const extracted = await this.llm.classifyAndExtract({
        filename: file.originalname,
        notes: notes ?? '',
      });
      await this.docRepository.updateDocument(documentId, {
        status: DOCUMENT_STATUS.NEEDS_TEXT,
        docType: toDocumentType(extracted.docType),
        extractedData: toPrismaJson(extracted as object),
      });
    } catch {
      // LLM failed. Still mark NEEDS_TEXT but with placeholder type so the doc is usable.
      await this.docRepository.updateDocument(documentId, {
        status: DOCUMENT_STATUS.NEEDS_TEXT,
        docType: DOCUMENT_TYPE.OTHER,
        extractedData: toPrismaJson({ docType: 'other', summary: '', rawNotes: notes }),
      });
    }
  }
}
