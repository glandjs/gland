import * as fs from 'fs';
import * as path from 'path';
const LINE = '==========================\n\t';
const BOX_BORDER = '─'.repeat(50);
type LogLevel = 'info' | 'warn' | 'error' | 'debug';
interface LoggerOptions {
  level?: LogLevel;
  file?: string;
  jsonFormat?: boolean;
  timestampFormat?: 'iso' | 'locale';
  rotation?: {
    enabled: boolean;
    maxSize: number; // Maximum file size in bytes
    maxFiles: number; // Maximum number of backup files
  };
  errorHandling?: {
    file: string;
    console: boolean;
  };
  transports?: Array<'console' | 'file'>;
}

const logLevels: Record<LogLevel, number> = {
  info: 1,
  warn: 2,
  error: 3,
  debug: 4,
};

const defaultOpts: LoggerOptions = {
  level: 'info',
  jsonFormat: false,
  timestampFormat: 'iso',
  rotation: {
    enabled: false,
    maxSize: 10485760, // 10 MB
    maxFiles: 5,
  },
  errorHandling: {
    file: 'error.log',
    console: true,
  },
  transports: ['console', 'file'],
};

const logColors: Record<LogLevel, string> = {
  info: '\x1b[32m', // green
  warn: '\x1b[33m', // yellow
  error: '\x1b[31m', // red
  debug: '\x1b[34m', // blue
};

const resetColor = '\x1b[0m';

const categoryHeaders: Record<string, string> = {
  server: LINE + 'SERVER:',
  app: LINE + 'APP:',
  middleware: LINE + 'MIDDLEWARE:',
  database: LINE + 'DATABASE:',
  default: LINE + 'INFO:',
};

const getFormattedTimestamp = (format: 'iso' | 'locale'): string => {
  const now = new Date();
  return format === 'locale'
    ? `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`
    : now.toISOString().replace('T', ' ').replace('Z', '');
};

export class Logger {
  private static instance: Logger;
  private level: LogLevel;
  private fileStream?: fs.WriteStream;
  private jsonFormat: boolean;
  private logFilePath: string = '/';
  private timestampFormat: 'iso' | 'locale';
  private lastCategory?: string;
  private category: Record<string, string> = { ...categoryHeaders };
  private rotation: { enabled: boolean; maxSize: number; maxFiles: number };
  private errorHandling: { file: string; console: boolean };
  private transports: Array<'console' | 'file'>;

  constructor(options: LoggerOptions = defaultOpts) {
    this.level = options.level || defaultOpts.level!;
    this.jsonFormat = options.jsonFormat ?? defaultOpts.jsonFormat!;
    this.timestampFormat = options.timestampFormat ?? defaultOpts.timestampFormat!;
    this.rotation = options.rotation ?? defaultOpts.rotation!;
    this.errorHandling = options.errorHandling ?? defaultOpts.errorHandling!;
    this.transports = options.transports ?? defaultOpts.transports!;

    if (options.file) {
      // Ensure the 'logs' directory exists
      const logsDir = path.join(process.cwd(), 'logs');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir);
      }

      // Create the full path to the log file
      this.logFilePath = path.join(logsDir, options.file);

      this.fileStream = fs.createWriteStream(this.logFilePath, { flags: 'a' });
      this.fileStream.on('error', (err) => {
        if (this.errorHandling.console) {
          console.error(`Failed to write to log file: ${err.message}`);
        }
        if (this.errorHandling.file) {
          fs.appendFileSync(
            path.join(logsDir, this.errorHandling.file),
            `Failed to write to log file: ${err.message}\n`,
          );
        }
        this.fileStream = undefined;
      });
    }
  }

  public static getInstance(options?: LoggerOptions): Logger {
    if (!Logger.instance || (options && options.file && !Logger.instance.fileStream)) {
      Logger.instance = new Logger(options || defaultOpts);
    }
    return Logger.instance;
  }

  public addCategory(category: string, header: string): void {
    this.category[category] = LINE + header;
  }

  private getTimestamp(): string {
    return getFormattedTimestamp(this.timestampFormat);
  }

  private formatMessage(message: string, level: LogLevel, category?: string): string {
    const timestamp = this.getTimestamp();
    const formattedCategory = category ? `[${category.toUpperCase()}]` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${formattedCategory}: ${message}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return logLevels[level] >= logLevels[this.level];
  }

  private logToConsole(message: string, level: LogLevel, category?: string): void {
    if (category && category !== this.lastCategory) {
      console.log(
        `${logColors[level]}${this.category[category] || this.category['default']}${resetColor}`,
      );
      this.lastCategory = category;
    }
    console.log(`${logColors[level]}${message}${resetColor}\n`);
  }

  private logToFile(message: string, level: LogLevel, category?: string): void {
    if (this.fileStream) {
      if (category && category !== this.lastCategory) {
        this.fileStream.write(`${LINE}${this.category[category] || this.category['default']}\n`);
        this.lastCategory = category;
      }
      this.fileStream.write(`${BOX_BORDER}\n`);
      this.fileStream.write(`${message}\n`);
      this.fileStream.write(`${BOX_BORDER}\n\n`);

      if (this.rotation?.enabled) {
        this.rotateFileIfNeeded();
      }
    }
  }

  private async rotateFileIfNeeded(): Promise<void> {
    if (this.fileStream && this.logFilePath) {
      const stats = await fs.promises.stat(this.logFilePath);
      if (stats.size >= this.rotation!.maxSize) {
        this.fileStream.end();
        this.rotateFiles();
        this.fileStream = fs.createWriteStream(this.logFilePath, { flags: 'a' });
        this.fileStream.on('error', (err) => {
          console.error(`Failed to write to log file: ${err.message}`);
          this.fileStream = undefined;
        });
      }
    }
  }

  private async rotateFiles(): Promise<void> {
    const logFileBase = path.basename(this.logFilePath!);
    const logFileDir = path.dirname(this.logFilePath!);

    for (let i = this.rotation!.maxFiles - 1; i > 0; i--) {
      const oldFile = path.join(logFileDir, `${logFileBase}.${i}`);
      const newFile = path.join(logFileDir, `${logFileBase}.${i + 1}`);
      if (fs.existsSync(oldFile)) {
        await fs.promises.rename(oldFile, newFile);
      }
    }

    const firstBackup = path.join(logFileDir, `${logFileBase}.1`);
    await fs.promises.rename(this.logFilePath!, firstBackup);
  }

  private async log(message: string, level: LogLevel, category?: string): Promise<void> {
    if (this.shouldLog(level)) {
      const formattedMessage = this.formatMessage(message, level, category);
      if (this.transports.includes('console')) {
        this.logToConsole(formattedMessage, level, category);
      }
      if (this.transports.includes('file')) {
        this.logToFile(formattedMessage, level, category);
      }
    }
  }

  public async info(message: string, category?: string): Promise<void> {
    await this.log(message, 'info', category);
  }

  public async warn(message: string, category?: string): Promise<void> {
    await this.log(message, 'warn', category);
  }

  public async error(message: string, error?: Error, category?: string): Promise<void> {
    const errorMessage = error ? `${message}}` : message;
    await this.log(errorMessage, 'error', category);
  }

  public async debug(message: string, category?: string): Promise<void> {
    await this.log(message, 'debug', category);
  }

  public setLevel(level: LogLevel): void {
    this.level = level;
  }

  public setJsonFormat(jsonFormat: boolean): void {
    this.jsonFormat = jsonFormat;
  }

  public setTimestampFormat(format: 'iso' | 'locale'): void {
    this.timestampFormat = format;
  }

  public closeFileStream(): void {
    if (this.fileStream) {
      this.fileStream.end();
    }
  }
}

export const logger = Logger.getInstance();
