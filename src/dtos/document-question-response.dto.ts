/** Document question as returned by the API (DTO). */
export type DocumentQuestionResponse = {
  id: string;
  documentId: string;
  question: string;
  answer: string;
  createdAt: Date;
};
