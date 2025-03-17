import { isFalsy, isNil, isObject, isString, Maybe } from '@medishn/toolkit';
import { IncomingMessage } from 'node:http';
import { BodyParserOptions, GlandMiddleware } from '../../interface';
import { AbstractPlugins } from '../abstract-plugins';
import { ConfigChannel } from '../../config/config.channel';

const CONTENT_TYPE = 'content-type';
const JSON_CONTENT_TYPE = 'application/json';
const URLENCODED_CONTENT_TYPE = 'application/x-www-form-urlencoded';
const TEXT_PLAIN_CONTENT_TYPE = 'text/plain';

const CONTENT_LENGTH_EXCEEDED = 'request entity too large';
const INVALID_JSON = 'invalid json';
const INVALID_URL_ENCODED = 'invalid url encoded data';
export class BodyParserChannel extends AbstractPlugins<BodyParserOptions, 'body'> {
  constructor(channel: ConfigChannel) {
    super(channel, 'body');
  }

  createMiddleware(): GlandMiddleware {
    return async (ctx, next) => {
      if (!this.hasBody(ctx.req)) {
        return next();
      }

      const contentType = this.getContentType(ctx.req);

      try {
        if (contentType.includes(JSON_CONTENT_TYPE)) {
          await this.parseJson(ctx);
        } else if (contentType.includes(URLENCODED_CONTENT_TYPE)) {
          await this.parseUrlEncoded(ctx);
        } else if (contentType.includes(TEXT_PLAIN_CONTENT_TYPE)) {
          await this.parseText(ctx);
        } else {
          ctx.body = {};
        }
        return next();
      } catch (error) {
        console.log('error->', error);

        ctx.body = {
          error: error.message || 'Error parsing request body',
        };
        ctx.status = 400;
        return;
      }
    };
  }

  private hasBody(req: IncomingMessage): boolean {
    const method = req.method!.toUpperCase();
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return false;
    }

    const contentLength = this.getContentLength(req);
    if (isNil(contentLength) || contentLength === 0) {
      return false;
    }

    if (contentLength > this.get('limit')) {
      throw new Error(CONTENT_LENGTH_EXCEEDED);
    }
    const transferEncoding = req.headers['transfer-encoding'];
    if (transferEncoding && transferEncoding.toLowerCase() === 'chunked') {
      return true;
    }
    return true;
  }
  private getContentLength(req: IncomingMessage): Maybe<number> {
    const header = req.headers['content-length'];
    if (!header) {
      return undefined;
    }

    const value = parseInt(Array.isArray(header) ? header[0] : header, 10);
    return isNaN(value) ? undefined : value;
  }
  private getContentType(req: IncomingMessage): string {
    const contentType = req.headers[CONTENT_TYPE] || '';
    return isString(contentType) ? contentType.toLowerCase() : '';
  }

  private async readBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: any[] = [];
      let size = 0;
      req.on('data', async (chunk: Buffer) => {
        chunks.push(chunk);
        size += chunk.length;

        if (size > this.get('limit')) {
          reject(new Error(CONTENT_LENGTH_EXCEEDED));
          req.destroy();
        }
      });

      req.on('end', async () => {
        if (chunks.length === 0) {
          resolve('');
          return;
        }
        try {
          const body = Buffer.concat(chunks).toString(this.get('encoding') as BufferEncoding);
          resolve(body);
        } catch (err) {
          reject(new Error(`Failed to decode request body: ${err.message}`));
        }
      });

      req.on('error', (err: Error) => {
        reject(new Error(`Request stream error: ${err.message}`));
      });

      req.on('aborted', () => {
        reject(new Error('Request aborted by client'));
      });
    });
  }

  private async parseJson(ctx: any): Promise<void> {
    try {
      const rawBody = await this.readBody(ctx.req);
      console.log('rawBody->', rawBody);
      const jsonConfig = this.get('json');
      const strictMode = jsonConfig?.strict !== false;
      console.log('strictMode->', strictMode);

      if (isFalsy(rawBody)) {
        ctx.body = {};
        return;
      }
      ctx.body = JSON.parse(rawBody, jsonConfig?.reviver);

      if (jsonConfig.strict && (isNil(ctx.body) || !isObject(ctx.body))) {
      }
    } catch (error) {
      if (error.message === CONTENT_LENGTH_EXCEEDED) {
        throw error;
      }
      throw new Error(INVALID_JSON);
    }
  }

  private async parseUrlEncoded(ctx: any): Promise<void> {
    try {
      const rawBody = await this.readBody(ctx.req);

      if (!rawBody) {
        ctx.body = {};
        return;
      }

      if (this.get('urlencoded')?.extended) {
        ctx.body = this.parseExtendedUrlEncoded(rawBody);
      } else {
        ctx.body = this.parseSimpleUrlEncoded(rawBody);
      }
    } catch (error) {
      if (error.message === CONTENT_LENGTH_EXCEEDED) {
        throw error;
      }
      throw new Error(INVALID_URL_ENCODED);
    }
  }

  private async parseText(ctx: any): Promise<void> {
    try {
      const rawBody = await this.readBody(ctx.req);
      ctx.body = rawBody;
    } catch (error) {
      if (error.message === CONTENT_LENGTH_EXCEEDED) {
        throw error;
      }
      throw new Error('Error parsing text body');
    }
  }

  private parseSimpleUrlEncoded(str: string): Record<string, string> {
    const result: Record<string, string> = {};

    if (!str || typeof str !== 'string') {
      return result;
    }

    str.split('&').forEach((item) => {
      const parts = item.split('=');
      if (parts.length >= 2) {
        const key = decodeURI(parts[0].replace(/\+/g, ' '));
        const value = decodeURI(parts.slice(1).join('=').replace(/\+/g, ' '));
        result[key] = value;
      }
    });

    return result;
  }

  /**
   * Extended URL-encoded parsing (supports nested objects and arrays)
   * This is a simplified version. In a real implementation, you'd use a library like 'qs'
   */
  private parseExtendedUrlEncoded(str: string): Record<string, any> {
    const result: Record<string, any> = {};

    if (!str || typeof str !== 'string') {
      return result;
    }

    str.split('&').forEach((item) => {
      const parts = item.split('=');
      if (parts.length >= 2) {
        const key = decodeURI(parts[0].replace(/\+/g, ' '));
        const value = decodeURI(parts.slice(1).join('=').replace(/\+/g, ' '));

        this.parseComplexKey(result, key, value);
      }
    });

    return result;
  }

  private parseComplexKey(obj: Record<string, any>, key: string, value: string): void {
    if (!key.includes('[')) {
      obj[key] = value;
      return;
    }

    const rootEnd = key.indexOf('[');
    const rootKey = key.substring(0, rootEnd);

    if (obj[rootKey] === undefined) {
      obj[rootKey] = {};
    }

    let current = obj[rootKey];
    let path = key.substring(rootEnd);
    let match: RegExpExecArray | null;
    const keyRegex = /\[([^\]]*)\]/g;
    const segments: Array<{ isArray: boolean; key: string }> = [];

    while ((match = keyRegex.exec(path)) !== null) {
      const segment = match[1];
      const isArray = segment === '';
      segments.push({ isArray, key: segment });
    }

    for (let i = 0; i < segments.length - 1; i++) {
      const { isArray, key: segment } = segments[i];
      const nextIsArray = segments[i + 1].isArray;

      if (isArray) {
        if (!Array.isArray(current)) {
          current = [];
          obj[rootKey] = current;
        }

        const idx = current.length;
        current[idx] = nextIsArray ? [] : {};
        current = current[idx];
      } else {
        if (Array.isArray(current)) {
          throw new Error(`Cannot use a string key with an array at '${key}'`);
        }
        if (current[segment] === undefined) {
          current[segment] = nextIsArray ? [] : {};
        }
        current = current[segment];
      }
    }

    const lastSegment = segments[segments.length - 1];
    if (lastSegment.isArray) {
      if (!Array.isArray(current)) {
        current = [];
        if (segments.length === 1) {
          obj[rootKey] = current;
        }
      }
      current.push(value);
    } else {
      if (Array.isArray(current)) {
        throw new Error(`Cannot use a string key with an array at '${key}'`);
      }
      current[lastSegment.key] = value;
    }
  }
}
