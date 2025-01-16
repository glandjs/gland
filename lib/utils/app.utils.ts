import { IncomingMessage, ServerResponse } from 'http';
import { Buffer } from 'buffer';
import { Qiks } from '@medishn/qiks';
import { Logger } from '@medishn/logger';
import { CacheConfigQiks } from '@medishn/qiks/dist/types/CacheTypes';
import { Options } from '@medishn/logger/dist/types';
import { AppConfig, BodyParserOptions } from '../common/interfaces';
import { KEY_SETTINGS } from '../common/enums';
import { ParsedBody } from '../common/types';

export class BodyParser {
  private req: IncomingMessage;
  private options: Required<BodyParserOptions>;

  constructor(req: IncomingMessage, options?: BodyParserOptions) {
    this.req = req;
    this.options = {
      limit: options?.limit ?? 1e6, // Default 1MB
      encoding: options?.encoding ?? 'utf-8',
    };
  }

  async parse(): Promise<ParsedBody> {
    return new Promise<ParsedBody>((resolve, reject) => {
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
        // If no body content was sent, return undefined for body, bodySize, and bodyRaw
        if (chunks.length === 0) {
          return resolve({
            body: null,
            bodyRaw: null,
            bodySize: 0,
          });
        }
        try {
          const rawBody = Buffer.concat(chunks);
          const bodyString = rawBody.toString(this.options.encoding);

          let parsedBody: ParsedBody['body'];
          if (!contentType) {
            parsedBody = { raw: bodyString };
          } else if (contentType.includes('application/json')) {
            parsedBody = { raw: JSON.parse(bodyString) };
          } else if (contentType.includes('text/plain')) {
            parsedBody = { raw: bodyString };
          } else if (contentType.includes('application/x-www-form-urlencoded')) {
            parsedBody = this.parseUrlEncoded(bodyString);
          } else if (contentType.includes('text/html')) {
            parsedBody = { raw: bodyString };
          } else if (contentType.includes('image/') || contentType.includes('application/octet-stream')) {
            parsedBody = rawBody;
          } else {
            parsedBody = { raw: bodyString };
          }

          resolve({
            body: parsedBody.raw,
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

/**
 * A caching system built on top of @medishn/qiks.
 */
export class MemoryCacheStore<K, V> extends Qiks<K, V> {
  constructor(options?: CacheConfigQiks<K>) {
    super(options);
  }
}
export class Glogger extends Logger {
  constructor(opts?: Options) {
    super(opts);
  }
}

export function setPoweredByHeader(res: ServerResponse, settings: AppConfig): void {
  const poweredBy = settings[KEY_SETTINGS.X_POWERED_BY] ?? true;

  if (poweredBy) {
    res.setHeader('X-Powered-By', 'Gland');
  } else {
    res.removeHeader('X-Powered-By');
  }
}
