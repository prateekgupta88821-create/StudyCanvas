/**
 * StudyCanvas Production-Grade Privacy-Safe Logger & Telemetry Utility
 *
 * Sanitizes errors, messages, and payloads to ensure NO personal access tokens,
 * passwords, Bearer headers, or PII are ever exposed in logs or telemetry.
 */

// Patterns to scrub from log messages and error stacks
const SENSITIVE_PATTERNS = [
  /ya29\.[a-zA-Z0-9_-]+/g, // Google OAuth tokens
  /Bearer\s+[a-zA-Z0-9_.-]+/gi, // Bearer auth headers
  /AIza[0-9A-Za-z-_]{35}/g, // Firebase / Google API keys
  /ey[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]*/g, // JWTs
  /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g, // Email addresses
];

function sanitizeString(input: string): string {
  if (!input) return input;
  let sanitized = input;
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }
  return sanitized;
}

function sanitizeObject(obj: any, depth = 0): any {
  if (depth > 4) return '[MaxDepth]';
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return sanitizeString(obj);
  if (typeof obj === 'number' || typeof obj === 'boolean') return obj;

  if (obj instanceof Error) {
    return {
      name: obj.name,
      message: sanitizeString(obj.message),
      stack: obj.stack ? sanitizeString(obj.stack) : undefined,
    };
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, depth + 1));
  }

  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj)) {
      // Redact sensitive keys outright
      if (/token|secret|password|auth|credential|key|authorization/i.test(key)) {
        cleaned[key] = '[REDACTED]';
      } else {
        cleaned[key] = sanitizeObject(val, depth + 1);
      }
    }
    return cleaned;
  }

  return String(obj);
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  module?: string;
  message: string;
  data?: any;
}

const ERROR_BUFFER: LogEntry[] = [];
const MAX_BUFFER_SIZE = 50;

export const logger = {
  info(message: string, data?: any, module?: string) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      module,
      message: sanitizeString(message),
      data: data !== undefined ? sanitizeObject(data) : undefined,
    };
    if (import.meta.env.DEV) {
      console.info(`[StudyCanvas:${entry.module || 'App'}]`, entry.message, entry.data ?? '');
    }
  },

  warn(message: string, data?: any, module?: string) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      module,
      message: sanitizeString(message),
      data: data !== undefined ? sanitizeObject(data) : undefined,
    };
    console.warn(`[StudyCanvas:${entry.module || 'App'}]`, entry.message, entry.data ?? '');
  },

  error(message: string, error?: any, module?: string) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      module,
      message: sanitizeString(message),
      data: error !== undefined ? sanitizeObject(error) : undefined,
    };

    // Buffer for diagnostic crash reporting
    ERROR_BUFFER.push(entry);
    if (ERROR_BUFFER.length > MAX_BUFFER_SIZE) {
      ERROR_BUFFER.shift();
    }

    console.error(`[StudyCanvas:${entry.module || 'App'}] ERROR:`, entry.message, entry.data ?? '');
  },

  /**
   * Returns recent sanitized error logs for support diagnostics
   */
  getRecentErrors(): readonly LogEntry[] {
    return ERROR_BUFFER;
  },

  /**
   * Clear error buffer
   */
  clearErrors() {
    ERROR_BUFFER.length = 0;
  },
};
