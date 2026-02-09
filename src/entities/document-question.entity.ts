import { BadRequestException } from '@nestjs/common';
import type { CreateDocumentQuestionDto, UpdateDocumentQuestionDto } from '../dtos';
import type { DocumentQuestion as DocumentQuestionShape } from '../interfaces';
import type { DocumentQuestionRecord } from '../types/document-question-record.types';
import { BaseEntity } from './base.entity';

export class DocumentQuestion extends BaseEntity implements DocumentQuestionShape {
  documentId!: string;
  question!: string;
  answer!: string;

  relations: string[] = [];

  static createFromDto(dto: CreateDocumentQuestionDto): DocumentQuestion {
    if (!dto.documentId?.trim() || !dto.question?.trim() || !dto.answer?.trim()) {
      throw new BadRequestException('Missing required fields in CreateDocumentQuestionDto');
    }
    const q = new DocumentQuestion();
    q.setUninitialized();
    q.documentId = dto.documentId;
    q.question = dto.question;
    q.answer = dto.answer;
    return q;
  }

  update(dto: UpdateDocumentQuestionDto): void {
    if (dto.answer !== undefined) this.answer = dto.answer;
  }

  static fromRecord(record: DocumentQuestionRecord): DocumentQuestion {
    const q = new DocumentQuestion();
    q.id = record.id;
    q.documentId = record.documentId;
    q.question = record.question;
    q.answer = record.answer;
    q.createdAt = record.createdAt;
    return q;
  }
}
