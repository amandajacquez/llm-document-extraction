process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-key';

import { LlmService } from '../src/services/llm.service';

const llmService = new LlmService();

const mockCreate = jest.fn();
jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  })),
}));

const validExtraction = {
  docType: 'invoice',
  confidence: 0.9,
  parties: { vendor: 'V', customer: 'C' },
  identifiers: { invoiceNumber: '1', poNumber: null },
  amounts: { subtotal: 100, tax: 10, total: 110, currency: 'USD' },
  dates: { issuedDate: '2024-01-01', dueDate: null },
  lineItems: null,
  summary: 'Test',
  rawNotes: null,
};

beforeEach(() => {
  mockCreate.mockReset();
});

describe('classifyAndExtract', () => {
  it('returns validated extraction when LLM returns valid JSON', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(validExtraction) } }],
    });

    const result = await llmService.classifyAndExtract({
      filename: 'inv.txt',
      notes: '',
      text: 'Invoice from V to C. Total 110.',
    });

    expect(result).toEqual(validExtraction);
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });
});

describe('answerQuestion', () => {
  it('returns answer from LLM', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: '  The total is 110.  ' } }],
    });

    const result = await llmService.answerQuestion({
      extractedData: validExtraction,
      rawText: null,
      question: 'What is the total?',
    });

    expect(result).toBe('The total is 110.');
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });
});
