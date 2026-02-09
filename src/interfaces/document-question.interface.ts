/** Domain entity shape: a document Q&A as used by the rest of the app. */
export interface DocumentQuestion {
  id: string;
  documentId: string;
  question: string;
  answer: string;
  createdAt: Date;
}
