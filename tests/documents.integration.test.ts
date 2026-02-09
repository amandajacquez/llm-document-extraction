import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { LlmService } from '../src/services/llm.service';
import { ApiErrorExceptionFilter } from '../src/filters/api-error.filter';
import { prisma } from '../src/prisma';

const mockClassifyAndExtract = jest.fn();
const mockAnswerQuestion = jest.fn();
const mockLlmService = {
  classifyAndExtract: mockClassifyAndExtract,
  answerQuestion: mockAnswerQuestion,
};

const validExtraction = {
  docType: 'invoice' as const,
  confidence: 0.95,
  parties: { vendor: 'Acme', customer: 'Client Inc' },
  identifiers: { invoiceNumber: 'INV-001', poNumber: null },
  amounts: { subtotal: 100, tax: 10, total: 110, currency: 'USD' },
  dates: { issuedDate: '2024-01-15', dueDate: '2024-02-15' },
  lineItems: [
    { description: 'Widget', quantity: 2, unitPrice: 50, amount: 100 },
  ],
  summary: 'Test invoice',
  rawNotes: null,
};

let app: INestApplication;

beforeAll(async () => {
  mockClassifyAndExtract.mockResolvedValue(validExtraction);
  mockAnswerQuestion.mockResolvedValue('The total is 110 USD.');

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(LlmService)
    .useValue(mockLlmService)
    .compile();

  app = moduleRef.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );
  app.useGlobalFilters(new ApiErrorExceptionFilter());
  await app.init();
});

afterEach(async () => {
  await prisma.documentQuestion.deleteMany({});
  await prisma.document.deleteMany({});
});

afterAll(async () => {
  await app?.close();
  await prisma.$disconnect();
});

const req = () => request(app.getHttpServer());

describe('POST /documents', () => {
  it('uploads .txt, processes with LLM, returns PROCESSED document', async () => {
    const textContent = 'Invoice from Acme to Client Inc. Total: 110 USD.';
    const res = await req()
      .post('/documents')
      .field('notes', 'test note')
      .attach('file', Buffer.from(textContent), { filename: 'doc.txt' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      originalFilename: 'doc.txt',
      status: 'PROCESSED',
      docType: 'INVOICE',
      notes: 'test note',
    });
    expect(res.body.extractedData).toEqual(validExtraction);
    expect(res.body.rawText).toBe(textContent);
    expect(res.body.extractedAt).toBeDefined();
  });

  it('returns 400 when file is missing', async () => {
    const res = await req()
      .post('/documents')
      .field('notes', 'no file');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject({ code: 'VALIDATION_ERROR' });
  });
});

describe('GET /documents', () => {
  it('returns paginated list (newest first)', async () => {
    const res = await req().get('/documents').query({ limit: 5, offset: 0 });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toMatchObject({ limit: 5, offset: 0 });
    expect(Array.isArray(res.body.items)).toBe(true);
  });
});

describe('GET /documents/:id', () => {
  it('returns 404 for missing document', async () => {
    const res = await req().get('/documents/non-existent-id');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatchObject({ code: 'NOT_FOUND' });
  });

  it('returns document with extractedData and timestamps when exists', async () => {
    const textContent = 'Receipt. Total 50.';
    const createRes = await req()
      .post('/documents')
      .attach('file', Buffer.from(textContent), { filename: 'r.txt' });
    const id = createRes.body.id;

    const res = await req().get(`/documents/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(id);
    expect(res.body.extractedData).toBeDefined();
    expect(res.body.createdAt).toBeDefined();
    expect(res.body.updatedAt).toBeDefined();
  });
});

describe('POST /documents/:id/questions', () => {
  it('stores Q&A and returns DocumentQuestion', async () => {
    const textContent = 'Invoice total 200.';
    const createRes = await req()
      .post('/documents')
      .attach('file', Buffer.from(textContent), { filename: 'q.txt' });
    const id = createRes.body.id;

    const res = await req()
      .post(`/documents/${id}/questions`)
      .send({ question: 'What is the total?' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      documentId: id,
      question: 'What is the total?',
      answer: 'The total is 110 USD.',
    });
    expect(res.body.id).toBeDefined();
    expect(res.body.createdAt).toBeDefined();

    const q = await prisma.documentQuestion.findFirst({
      where: { documentId: id },
    });
    expect(q).not.toBeNull();
    expect(q?.question).toBe('What is the total?');
    expect(q?.answer).toBe('The total is 110 USD.');
  });

  it('returns 404 for missing document', async () => {
    const res = await req()
      .post('/documents/non-existent-id/questions')
      .send({ question: 'What?' });
    expect(res.status).toBe(404);
    expect(res.body.error).toMatchObject({ code: 'NOT_FOUND' });
  });

  it('returns 400 when question is missing', async () => {
    const createRes = await req()
      .post('/documents')
      .attach('file', Buffer.from('x'), { filename: 'x.txt' });
    const res = await req()
      .post(`/documents/${createRes.body.id}/questions`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject({ code: 'VALIDATION_ERROR' });
  });
});
