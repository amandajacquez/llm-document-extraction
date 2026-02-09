import { Module } from '@nestjs/common';
import { DocumentRepository } from '../../repositories/document.repository';
import { DocumentQuestionRepository } from '../../repositories/document-question.repository';
import { DocumentsService } from '../../services/documents.service';
import { LlmService } from '../../services/llm.service';
import { PrismaService } from '../../prisma.service';
import { DocumentsController } from '../../controllers/documents.controller';

@Module({
  controllers: [DocumentsController],
  providers: [
    PrismaService,
    DocumentRepository,
    DocumentQuestionRepository,
    LlmService,
    DocumentsService,
  ],
})
export class DocumentsModule {}
