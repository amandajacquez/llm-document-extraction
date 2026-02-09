import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { config } from '../config';
import {
  extractionSchema,
  EXTRACTION_SYSTEM,
  buildExtractionUserPrompt,
  buildStrictRetryUserPrompt,
  type ExtractedData,
} from '../types/extraction-schema.types';

export type { ExtractedData } from '../types/extraction-schema.types';

// LLM service: extraction and Q&A. Injected in DocumentsModule.
@Injectable()
export class LlmService {
  // Returns OpenAI client. Throws if OPENAI_API_KEY is not set.
  private getClient(): OpenAI {
    if (!config.openaiApiKey) {
      throw new Error('OPENAI_API_KEY is not set');
    }
    return new OpenAI({ apiKey: config.openaiApiKey });
  }

  // Classifies document type and extracts structured data. Uses full text when provided, otherwise filename and notes only. Validates with schema and retries once on invalid JSON.
  async classifyAndExtract(params: {
    filename: string;
    notes: string;
    text?: string;
  }): Promise<ExtractedData> {
    const { filename, notes, text } = params;
    const maxLen = config.maxTextLengthForExtraction;
    const truncated = text ? text.slice(0, maxLen) : '';
    const hasText = truncated.length > 0;

    const content = hasText
      ? buildExtractionUserPrompt(truncated, filename, notes)
      : `Classify this document from filename and notes only. Use minimal placeholders for missing fields (null where appropriate).\nFilename: ${filename}\nNotes: ${notes || '(none)'}`;

    const client = this.getClient();

    const run = async (userContent: string, isRetry = false): Promise<ExtractedData> => {
      const response = await client.chat.completions.create({
        model: config.chatModel,
        messages: [
          { role: 'system', content: isRetry ? EXTRACTION_SYSTEM + '\n\nOutput ONLY the JSON object, no markdown.' : EXTRACTION_SYSTEM },
          { role: 'user', content: userContent },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      });
      const raw = response.choices[0]?.message?.content?.trim();
      if (!raw) throw new Error('Empty LLM response');
      // Strip markdown code fences if present
      const cleaned = raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = ((): unknown => {
        try {
          return JSON.parse(cleaned);
        } catch {
          return null;
        }
      })();
      if (parsed === null) {
        if (!isRetry) return run(buildStrictRetryUserPrompt(raw), true);
        throw new Error('Invalid JSON from LLM');
      }
      const result = extractionSchema.safeParse(parsed);
      if (result.success) return result.data;
      if (!isRetry) return run(buildStrictRetryUserPrompt(raw), true);
      throw new Error('Schema validation failed');
    };

    return run(content);
  }

  // Answers a question using the document's extractedData and optional rawText. Returns the model reply or a fallback string.
  async answerQuestion(params: {
    extractedData: unknown;
    rawText: string | null;
    question: string;
  }): Promise<string> {
    const { extractedData, rawText, question } = params;
    const contextParts: string[] = [
      'Structured extracted data (JSON):',
      JSON.stringify(extractedData, null, 2),
    ];
    if (rawText) {
      const snippet = rawText.slice(0, 8000);
      contextParts.push('\n\nRaw text snippet:\n' + snippet);
    }
    const client = this.getClient();
    const response = await client.chat.completions.create({
      model: config.chatModel,
      messages: [
        {
          role: 'system',
          content: 'Answer the user question based only on the provided document context. Be concise.',
        },
        {
          role: 'user',
          content: `${contextParts.join('\n')}\n\nQuestion: ${question}`,
        },
      ],
      temperature: 0.2,
    });
    const answer = response.choices[0]?.message?.content?.trim();
    return answer ?? 'No answer generated.';
  }
}
