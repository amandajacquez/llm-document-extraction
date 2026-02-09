import type { DocumentQuestionResponse } from '../dtos';
import type { DocumentQuestion } from '../interfaces';

export function toDocumentQuestionResponse(q: DocumentQuestion): DocumentQuestionResponse {
  return {
    id: q.id,
    documentId: q.documentId,
    question: q.question,
    answer: q.answer,
    createdAt: q.createdAt,
  };
}
