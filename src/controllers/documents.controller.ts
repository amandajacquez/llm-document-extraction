import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { config } from '../config';
import type { DocumentResponse, DocumentQuestionResponse } from '../dtos';
import { AskQuestionDto } from '../dtos/ask-question.dto';
import { ListDocumentsQueryDto } from '../dtos/list-documents-query.dto';
import { DocumentsService } from '../services/documents.service';


@Controller('documents')
export class DocumentsController {
  constructor(private readonly service: DocumentsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: config.maxUploadBytes },
    }),
  )
  @HttpCode(HttpStatus.CREATED)
  async createDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { notes?: string },
  ): Promise<DocumentResponse> {
    return this.service.createDocument({ file, body });
  }

  @Get()
  async listDocuments(@Query() query: ListDocumentsQueryDto) {
    return this.service.listDocuments(query);
  }

  @Get(':id')
  async getDocument(@Param('id') id: string): Promise<DocumentResponse> {
    return this.service.getDocumentById(id);
  }

  @Post(':id/questions')
  @HttpCode(HttpStatus.CREATED)
  async postQuestion(
    @Param('id') documentId: string,
    @Body() body: AskQuestionDto,
  ): Promise<DocumentQuestionResponse> {
    return this.service.addQuestion(documentId, body);
  }
}
