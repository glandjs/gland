import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LoggerOptions {
    level?: LogLevel;
    file?: string;
    jsonFormat?: boolean;
    timestampFormat?: 'iso' | 'locale';
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
};

const logColors: Record<LogLevel, string> = {
    info: '\x1b[32m', // green
    warn: '\x1b[33m', // yellow
    error: '\x1b[31m', // red
    debug: '\x1b[34m', // blue
};

const resetColor = '\x1b[0m';

const categoryHeaders: Record<string, string> = {
    server: '==========================\n\tSERVER:',
    app: '==========================\n\tAPP:',
    middleware: '==========================\n\tMIDDLEWARE:',
    database: '=========================\n\tDATABASE:',
    default: '==========================\n\tINFO:',
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
    private timestampFormat: 'iso' | 'locale';
    private lastCategory?: string;

    private constructor(options: LoggerOptions = defaultOpts) {
        this.level = options.level || defaultOpts.level!;
        this.jsonFormat = options.jsonFormat ?? defaultOpts.jsonFormat!;
        this.timestampFormat = options.timestampFormat ?? defaultOpts.timestampFormat!;

        if (options.file) {
            this.fileStream = fs.createWriteStream(path.join(process.cwd(), options.file), { flags: 'a' });
            this.fileStream.on('error', (err) => {
                console.error(`Failed to write to log file: ${err.message}`);
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

    private getTimestamp(): string {
        return getFormattedTimestamp(this.timestampFormat);
    }

    private formatMessage(message: string, level: LogLevel, category?: string): string {
        const timestamp = this.getTimestamp();
        if (this.jsonFormat) {
            return JSON.stringify({ timestamp, level, category, message });
        } else {
            return `[${timestamp}] [${level.toUpperCase()}] ${category ? `[${category.toUpperCase()}]` : ''}: ${message}`;
        }
    }

    private shouldLog(level: LogLevel): boolean {
        return logLevels[level] >= logLevels[this.level];
    }

    private logToConsole(message: string, level: LogLevel, category?: string): void {
        if (category && category !== this.lastCategory) {
            console.log(`${logColors[level]}${categoryHeaders[category] || categoryHeaders['default']}${resetColor}`);
            this.lastCategory = category;
        }
        console.log(`${logColors[level]}${message}${resetColor}\n`);
    }

    private logToFile(message: string, category?: string): void {
        if (this.fileStream) {
            if (category && category !== this.lastCategory) {
                this.fileStream.write(`${categoryHeaders[category] || categoryHeaders['default']}\n`);
                this.lastCategory = category;
            }
            this.fileStream.write(`${message}\n`);
        }
    }

    private log(message: string, level: LogLevel, category?: string): void {
        if (this.shouldLog(level)) {
            const formattedMessage = this.formatMessage(message, level, category);
            this.logToConsole(formattedMessage, level, category);
            this.logToFile(formattedMessage, category);
        }
    }

    public info(message: string, category?: string): void {
        this.log(message, 'info', category);
    }

    public warn(message: string, category?: string): void {
        this.log(message, 'warn', category);
    }

    public error(message: string, error?: Error, category?: string): void {
        const errorMessage = error
            ? `${message}\nStack Trace: ${util.inspect(error.stack)}`
            : message;
        this.log(errorMessage, 'error', category);
    }

    public debug(message: string, category?: string): void {
        this.log(message, 'debug', category);
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

// Create a singleton instance with default options
export const logger = Logger.getInstance();
