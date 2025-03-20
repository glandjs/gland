import { Transform, TransformCallback } from 'node:stream';
import { IncomingMessage, ServerResponse } from 'node:http';
import { HttpHeaders } from '../interface';
import { HeadersManager } from './managers';
import { Maybe } from '@medishn/toolkit';

type MessageEvent = {
  type?: string;
  id?: string | number;
  retry?: number;
  data?: string | object;
};

export class SSEStream extends Transform {
  private lastEventId: number = 0;
  private readonly header: HttpHeaders;

  constructor(
    request: IncomingMessage,
    private response: ServerResponse,
  ) {
    super({ objectMode: true });
    this.header = new HeadersManager(response, request);

    this.configureSSEHeaders();
    this.configureSocket(request);
  }

  private configureSSEHeaders(): void {
    this.header.set('content-type', 'text/event-stream');
    this.header.set('cache-control', 'no-cache, no-store, must-revalidate');
    this.header.set('connection', 'keep-alive');
    this.header.set('pragma', 'no-cache');
    this.header.set('expires', '0');
    this.header.set('x-accel-buffering', 'no');
  }

  private configureSocket(request?: IncomingMessage): void {
    if (request?.socket) {
      request.socket.setKeepAlive(true);
      request.socket.setNoDelay(true);
      request.socket.setTimeout(0);
    }
  }

  pipe<T extends NodeJS.WritableStream>(destination: T, options?: { end?: boolean }): T {
    this.response.flushHeaders();
    this.write('\n');
    return super.pipe(destination, options);
  }

  _transform(message: MessageEvent, encoding: BufferEncoding, callback: TransformCallback): void {
    try {
      const eventString = this.serializeMessage(message);
      this.push(eventString);
      callback();
    } catch (error) {
      callback(error instanceof Error ? error : new Error('SSE serialization error'));
    }
  }

  private serializeMessage(message: MessageEvent): string {
    let output = '';

    if (message.id) {
      this.lastEventId = Number(message.id);
    } else {
      output += `id: ${++this.lastEventId}\n`;
    }

    if (message.type) output += `event: ${message.type}\n`;
    if (message.retry) output += `retry: ${message.retry}\n`;
    if (message.data) output += this.serializeData(message.data);

    return output + '\n';
  }

  private serializeData(data: string | object): string {
    const stringData = typeof data === 'string' ? data : JSON.stringify(data);
    return stringData
      .split(/\r\n|\r|\n/)
      .map((line) => `data: ${line}\n`)
      .join('');
  }

  writeMessage(message: MessageEvent, callback: (error: Maybe<Error>) => void): void {
    if (!this.write(message, 'utf-8')) {
      this.once('drain', () => callback(null));
    } else {
      process.nextTick(() => callback(null));
    }
  }

  close(): void {
    this.end(() => {
      if (this.response.writableEnded) return;
      this.response.end();
    });
  }

  _final(callback: (error?: Maybe<Error>) => void): void {
    this.close();
    callback();
  }
}
