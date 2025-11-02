/**
 * Safe logger utility for production
 * Prevents logging sensitive data in production environment
 */

type LogLevel = 'log' | 'warn' | 'error' | 'info' | 'debug';

interface SafeLogOptions {
  allowInProduction?: boolean;
  includeDetails?: boolean;
}

export class SafeLogger {
  private static isDevelopment = process.env.NODE_ENV === 'development';

  /**
   * Safe log method - only logs in development or when explicitly allowed
   */
  private static logMessage(level: LogLevel, message: string, data?: unknown, options: SafeLogOptions = {}) {
    const { allowInProduction = false, includeDetails = false } = options;

    // Only log if:
    // 1. In development mode, OR
    // 2. Explicitly allowed in production (for critical errors only)
    if (!this.isDevelopment && !allowInProduction) {
      return;
    }

    // In production, only log the message without sensitive data unless explicitly allowed
    if (!this.isDevelopment && !includeDetails) {
      console[level](message);
      return;
    }

    // In development, log everything
    if (data) {
      console[level](message, data);
    } else {
      console[level](message);
    }
  }

  /**
   * Log info messages (development only)
   */
  static info(message: string, data?: unknown) {
    this.logMessage('info', message, data);
  }

  /**
   * Log debug messages (development only)
   */
  static debug(message: string, data?: unknown) {
    this.logMessage('debug', message, data);
  }

  /**
   * Log warnings (development only, production only with explicit allow)
   */
  static warn(message: string, data?: unknown, options: SafeLogOptions = {}) {
    this.logMessage('warn', message, data, { ...options, allowInProduction: false });
  }

  /**
   * Log errors - can be allowed in production for critical issues
   */
  static error(message: string, data?: unknown, options: SafeLogOptions = {}) {
    this.logMessage('error', message, data, options);
  }

  /**
   * Log general messages (development only)
   */
  static log(message: string, data?: unknown) {
    this.logMessage('log', message, data);
  }

  /**
   * Critical errors that should always be logged even in production
   * but without sensitive data
   */
  static critical(message: string) {
    console.error(message);
  }
}

/**
 * Convenience exports
 */
export const logger = {
  info: (message: string, data?: unknown) => SafeLogger.info(message, data),
  debug: (message: string, data?: unknown) => SafeLogger.debug(message, data),
  warn: (message: string, data?: unknown, options?: SafeLogOptions) => SafeLogger.warn(message, data, options),
  error: (message: string, data?: unknown, options?: SafeLogOptions) => SafeLogger.error(message, data, options),
  log: (message: string, data?: unknown) => SafeLogger.log(message, data),
  critical: (message: string) => SafeLogger.critical(message),
};