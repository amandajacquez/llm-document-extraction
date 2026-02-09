/** Minimal logger; can be swapped for pino/winston later. */
function log(level: string, message: string, meta?: Record<string, unknown>): void {
  const payload = meta ? `${message} ${JSON.stringify(meta)}` : message;
  if (level === 'error') {
    console.error(`[error] ${payload}`);
  } else if (level === 'warn') {
    console.warn(`[warn] ${payload}`);
  } else {
    console.info(`[info] ${payload}`);
  }
}

export const logger = {
  error(message: string, meta?: Record<string, unknown>): void {
    log('error', message, meta);
  },
  warn(message: string, meta?: Record<string, unknown>): void {
    log('warn', message, meta);
  },
  info(message: string, meta?: Record<string, unknown>): void {
    log('info', message, meta);
  },
};
