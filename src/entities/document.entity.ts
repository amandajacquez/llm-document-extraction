import { BadRequestException } from '@nestjs/common';
import type { CreateDocumentDto, DocumentCreatePayloadDto, UpdateDocumentDto } from '../dtos';
import { DOCUMENT_STATUS } from '../types/document-status.types';
import type { Document as DocumentShape } from '../interfaces';
import type { DocumentRecord } from '../types/document-record.types';
import { BaseEntity } from './base.entity';

export class Document extends BaseEntity implements DocumentShape {
  override updatedAt!: Date; // required by DocumentShape; BaseEntity has optional for entities without it
  originalFilename!: string;
  storagePath!: string;
  mimeType!: string;
  notes!: string | null;
  status!: string;
  docType!: string | null;
  extractedData!: unknown;
  rawText!: string | null;
  extractedAt!: Date | null;

  relations: string[] = [];

  static createFromDto(dto: CreateDocumentDto): Document {
    if (!dto.originalFilename?.trim() || !dto.storagePath?.trim() || !dto.mimeType?.trim()) {
      throw new BadRequestException('Missing required fields in CreateDocumentDto');
    }
    const doc = new Document();
    doc.setUninitialized();
    doc.updatedAt = BaseEntity.UNINITIALIZED_DATE;
    doc.originalFilename = dto.originalFilename;
    doc.storagePath = dto.storagePath;
    doc.mimeType = dto.mimeType;
    doc.notes = dto.notes ?? null;
    doc.status = DOCUMENT_STATUS.UPLOADED;
    doc.docType = null;
    doc.extractedData = null;
    doc.rawText = null;
    doc.extractedAt = null;
    return doc;
  }

  toCreatePayload(): DocumentCreatePayloadDto {
    return {
      originalFilename: this.originalFilename,
      storagePath: this.storagePath,
      mimeType: this.mimeType,
      notes: this.notes,
      status: this.status,
      docType: this.docType as null,
    };
  }

  update(dto: UpdateDocumentDto): void {
    if (dto.status !== undefined) this.status = dto.status;
    if (dto.docType !== undefined) this.docType = dto.docType;
    if (dto.extractedData !== undefined) this.extractedData = dto.extractedData;
    if (dto.rawText !== undefined) this.rawText = dto.rawText;
    if (dto.extractedAt !== undefined) this.extractedAt = dto.extractedAt;
  }

  static fromRecord(record: DocumentRecord): Document {
    const doc = new Document();
    doc.id = record.id;
    doc.originalFilename = record.originalFilename;
    doc.storagePath = record.storagePath;
    doc.mimeType = record.mimeType;
    doc.notes = record.notes;
    doc.status = record.status;
    doc.docType = record.docType;
    doc.extractedData = record.extractedData;
    doc.rawText = record.rawText;
    doc.extractedAt = record.extractedAt;
    doc.createdAt = record.createdAt;
    doc.updatedAt = record.updatedAt;
    return doc;
  }
}
