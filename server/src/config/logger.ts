type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const isProd = process.env.NODE_ENV === 'production';

export const logger = {
  info(message: string, data?: unknown) {
    if (!isProd) console.log(`[INFO] ${message}`, data || '');
  },

  warn(message: string, data?: unknown) {
    console.warn(`[WARN] ${message}`, data || '');
  },

  error(message: string, error: unknown) {
    console.error(`[ERROR] ${message}`, error);
  },

  debug(message: string, data?: unknown) {
    if (!isProd) console.log(`[DEBUG] ${message}`, data || '');
  },
};
