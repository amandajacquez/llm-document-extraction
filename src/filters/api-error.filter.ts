import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import type { ApiError } from '../utils/errors';

@Catch()
export class ApiErrorExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiErrorExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const code = statusCode === 400 ? 'VALIDATION_ERROR' : 'HTTP_ERROR';
      const response = exception.getResponse();
      const message =
        typeof response === 'object' && response != null && 'message' in response
          ? Array.isArray((response as { message: unknown }).message)
            ? (response as { message: string[] }).message.join('; ')
            : String((response as { message: string }).message)
          : exception.message;
      this.logger.error(message, { code, statusCode });
      res.status(statusCode).json({ error: { code, message } });
      return;
    }

    const err = exception as ApiError;
    const statusCode = err?.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR;
    const code = err?.code ?? 'INTERNAL_ERROR';
    const message =
      statusCode >= 500 ? 'An unexpected error occurred' : (err?.message ?? 'Unknown error');
    this.logger.error(message, { code, statusCode });
    res.status(statusCode).json({ error: { code, message } });
  }
}
