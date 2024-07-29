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

export class Logger {
    private static instance: Logger;
    private level: LogLevel;
    private fileStream?: fs.WriteStream;
    private jsonFormat: boolean;
    private timestampFormat: 'iso' | 'locale';

    private constructor(options: LoggerOptions = defaultOpts) {
        this.level = options.level || defaultOpts.level!;
        this.jsonFormat = options.jsonFormat ?? defaultOpts.jsonFormat!;
        this.timestampFormat = options.timestampFormat ?? defaultOpts.timestampFormat!;

        if (options.file) {
            this.fileStream = fs.createWriteStream(path.resolve(options.file), { flags: 'a' });
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
        const now = new Date();
        return this.timestampFormat === 'locale' ? now.toLocaleString() : now.toISOString();
    }

    private formatMessage(message: string, level: LogLevel): string {
        const timestamp = this.getTimestamp();
        if (this.jsonFormat) {
            return JSON.stringify({ timestamp, level, message });
        } else {
            return `[${timestamp}] [${level.toUpperCase()}]: ${message}`;
        }
    }

    private shouldLog(level: LogLevel): boolean {
        return logLevels[level] >= logLevels[this.level];
    }

    private logToConsole(message: string, level: LogLevel): void {
        console.log(`${logColors[level]}${message}${resetColor}`);
    }

    private logToFile(message: string): void {
        if (this.fileStream) {
            this.fileStream.write(`${message}\n`);
        }
    }

    private log(message: string, level: LogLevel): void {
        if (this.shouldLog(level)) {
            const formattedMessage = this.formatMessage(message, level);
            this.logToConsole(formattedMessage, level);
            this.logToFile(formattedMessage);
        }
    }

    public info(message: string): void {
        this.log(message, 'info');
    }

    public warn(message: string): void {
        this.log(message, 'warn');
    }

    public error(message: string, error?: Error): void {
        const errorMessage = error
            ? `${message}\nStack Trace: ${util.inspect(error.stack)}`
            : message;
        this.log(errorMessage, 'error');
    }

    public debug(message: string): void {
        this.log(message, 'debug');
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