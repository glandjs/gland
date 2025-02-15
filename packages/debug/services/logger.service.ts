import { LoggerService } from '../interfaces/logger.interfaces';
import { LogLevel } from '../types/logger.types';
const DEFAULT_LOGGER = console;

export class Logger implements LoggerService {
  protected static logLevels: LogLevel[] = ['log', 'error', 'warn', 'debug', 'verbose'];
  private static staticInstance: LoggerService = DEFAULT_LOGGER;
  private static defaultContext = 'Application';

  constructor(protected context?: string, protected options: { timestamp?: boolean } = {}) {}

  /**
   * Write an 'error' level log.
   */
  error(message: any, stack?: string, context?: string): void;
  error(message: any, ...optionalParams: [...any, string?, string?]): void;
  error(message: any, ...optionalParams: any[]) {
    this.logWithLevel('error', message, optionalParams);
  }

  /**
   * Write a 'log' level log.
   */
  log(message: any, context?: string): void;
  log(message: any, ...optionalParams: [...any, string?]): void;
  log(message: any, ...optionalParams: any[]) {
    this.logWithLevel('log', message, optionalParams);
  }

  /**
   * Write a 'warn' level log.
   */
  warn(message: any, context?: string): void;
  warn(message: any, ...optionalParams: [...any, string?]): void;
  warn(message: any, ...optionalParams: any[]) {
    this.logWithLevel('warn', message, optionalParams);
  }

  /**
   * Write a 'debug' level log.
   */
  debug(message: any, context?: string): void;
  debug(message: any, ...optionalParams: [...any, string?]): void;
  debug(message: any, ...optionalParams: any[]) {
    this.logWithLevel('debug', message, optionalParams);
  }

  /**
   * Write a 'verbose' level log.
   */
  verbose(message: any, context?: string): void;
  verbose(message: any, ...optionalParams: [...any, string?]): void;
  verbose(message: any, ...optionalParams: any[]) {
    this.logWithLevel('verbose', message, optionalParams);
  }
  static setLogLevels(levels: LogLevel[]): void {
    this.logLevels = levels;
  }

  static getTimestamp(): string {
    return new Date().toISOString();
  }

  static isLevelEnabled(level: LogLevel): boolean {
    return this.logLevels!.includes(level);
  }

  private logWithLevel(level: LogLevel, message: any, params: any[]): void {
    if (!Logger.isLevelEnabled(level)) return;

    const logger = Logger.staticInstance;
    const context = this.context || Logger.defaultContext;
    const timestamp = this.options.timestamp ? `[${Logger.getTimestamp()}] ` : '';

    const formattedMessage = `${timestamp}[${context}] ${message}`;
    if (typeof logger[level] === 'function') {
      logger[level](formattedMessage, ...params);
    } else {
      logger.log(formattedMessage, ...params);
    }
  }
}
