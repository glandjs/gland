import { IncomingMessage } from 'http';
import { Buffer } from 'buffer';

export type ParsedBody<T = any> = {
  body?: T;
  bodyRaw: Buffer;
  bodySize: number;
};

export interface BodyParserOptions {
  limit?: number; // Maximum allowed body size in bytes
  encoding?: BufferEncoding; // Character encoding for the body
}

export class BodyParser {
  private req: IncomingMessage;
  private options: Required<BodyParserOptions>;

  constructor(req: IncomingMessage, options?: BodyParserOptions) {
    this.req = req;
    this.options = {
      limit: options?.limit || 1e6, // Default 1MB
      encoding: options?.encoding || 'utf-8',
    };
  }

  async parse<T = any>(): Promise<ParsedBody<T>> {
    return new Promise<ParsedBody<T>>((resolve, reject) => {
      let bodySize = 0;
      const chunks: Buffer[] = [];
      const contentType = this.req.headers['content-type'];

      this.req.on('data', (chunk) => {
        bodySize += chunk.length;

        // Check for body size limit
        if (bodySize > this.options.limit) {
          this.req.destroy();
          return reject(new Error(`Body size exceeds the limit of ${this.options.limit} bytes`));
        }

        chunks.push(chunk);
      });

      this.req.on('end', () => {
        try {
          const rawBody = Buffer.concat(chunks);
          const bodyString = rawBody.toString(this.options.encoding);

          let parsedBody: T | undefined;

          if (!contentType) {
            parsedBody = bodyString as T; // Default to text/plain if no content type
          } else if (contentType.includes('application/json')) {
            parsedBody = JSON.parse(bodyString);
          } else if (contentType.includes('text/plain')) {
            parsedBody = bodyString as T;
          } else if (contentType.includes('application/x-www-form-urlencoded')) {
            parsedBody = this.parseUrlEncoded(bodyString) as T;
          } else if (contentType.includes('text/html')) {
            parsedBody = bodyString as T; // Treat HTML as plain text
          } else if (contentType.includes('image/') || contentType.includes('application/octet-stream')) {
            parsedBody = rawBody as T; // Binary data for images and files
          } else {
            parsedBody = bodyString as T; // Fallback for unknown types
          }

          resolve({
            body: parsedBody,
            bodyRaw: rawBody,
            bodySize,
          });
        } catch (error: any) {
          reject(new Error(`Error parsing body: ${error.message}`));
        }
      });

      this.req.on('error', (error) => {
        reject(new Error(`Request error: ${error.message}`));
      });
    });
  }
  private parseUrlEncoded(data: string): Record<string, string> {
    return data.split('&').reduce((result: Record<string, string>, pair) => {
      const [key, value] = pair.split('=');
      if (key) {
        result[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
      }
      return result;
    }, {});
  }
}
