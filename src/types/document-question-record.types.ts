/** Persistence shape: what we get from Prisma/DB for DocumentQuestion. Mapped to DocumentQuestion entity by the repository. */
export type DocumentQuestionRecord = {
  id: string;
  documentId: string;
  question: string;
  answer: string;
  createdAt: Date;
};
