import { Injectable } from '@nestjs/common';
import { DocumentQuestion } from '../entities/document-question.entity';
import type {
  CreateDocumentQuestionDto,
  UpdateDocumentQuestionDto,
} from '../dtos';
import type { DocumentQuestionRecord } from '../types/document-question-record.types';
import { PrismaService } from '../prisma.service';
import { BaseRepository, type BaseRepositoryDelegate } from './base.repository';

/**
 * Repository for DocumentQuestion: persistence and lookup.
 * Extends BaseRepository; one repository per entity.
 */
@Injectable()
export class DocumentQuestionRepository extends BaseRepository<
  DocumentQuestionRecord,
  CreateDocumentQuestionDto,
  UpdateDocumentQuestionDto
> {
  constructor(private readonly prisma: PrismaService) {
    super(
      prisma.documentQuestion as unknown as BaseRepositoryDelegate<
        DocumentQuestionRecord,
        CreateDocumentQuestionDto,
        UpdateDocumentQuestionDto
      >
    );
  }

  async createQuestion(dto: CreateDocumentQuestionDto): Promise<DocumentQuestion> {
    DocumentQuestion.createFromDto(dto); // validates
    const record = await this.create(dto);
    return DocumentQuestion.fromRecord(record);
  }

  async updateQuestion(id: string, data: UpdateDocumentQuestionDto): Promise<DocumentQuestion> {
    const record = await this.update(id, data);
    return DocumentQuestion.fromRecord(record);
  }

  async getQuestionById(id: string): Promise<DocumentQuestion | null> {
    const record = await this.findById(id);
    return record ? DocumentQuestion.fromRecord(record) : null;
  }

  async getQuestionByIdOrThrow(id: string): Promise<DocumentQuestion> {
    const record = await this.findById(id);
    if (!record) throw new Error(`DocumentQuestion not found: ${id}`);
    return DocumentQuestion.fromRecord(record);
  }
}
