import type { Response } from 'express';
import { logger } from './logger';

/** Standard error shape for API responses (used throughout the app). */
export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

export interface ApiErrorOptions {
  statusCode: number;
  code: string;
}

/** Create an error in the standard API shape. */
export function createApiError(message: string, options: ApiErrorOptions): ApiError {
  const err = new Error(message) as ApiError;
  err.statusCode = options.statusCode;
  err.code = options.code;
  return err;
}

/** Send the standard API error response and log. Use in controllers instead of passing to next(err). */
export function sendErrorResponse(err: ApiError, res: Response): void {
  const statusCode = err.statusCode ?? 500;
  const code = err.code ?? 'INTERNAL_ERROR';
  const message = statusCode >= 500 ? 'An unexpected error occurred' : (err.message ?? 'Unknown error');

  logger.error(message, { code, statusCode });

  res.status(statusCode).json({
    error: {
      code,
      message,
    },
  });
}
