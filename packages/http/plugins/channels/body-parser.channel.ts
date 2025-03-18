import { isFalsy, isNil, isObject, isString, isUndefined, type Dictionary } from '@medishn/toolkit';
import { IncomingMessage } from 'node:http';
import { BodyParserOptions, GlandMiddleware, HttpContext } from '../../interface';
import { AbstractPlugins } from '../abstract-plugins';
import { ConfigChannel } from '../../config/config.channel';
import { BodyParserError } from '../utils';

const CONTENT_TYPE = 'content-type';
const JSON_CONTENT_TYPE = 'application/json';
const URLENCODED_CONTENT_TYPE = 'application/x-www-form-urlencoded';
const TEXT_PLAIN_CONTENT_TYPE = 'text/plain';
export class BodyParserChannel extends AbstractPlugins<BodyParserOptions, 'body'> {
  constructor(channel: ConfigChannel) {
    super(channel, 'body');
  }

  createMiddleware(): GlandMiddleware {
    return async (ctx, next) => {
      if (!this.hasBody(ctx)) {
        ctx.body = {};
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
        if (error instanceof BodyParserError) {
          ctx.status = error.status;
          ctx.body = {
            error: error.message,
            type: error.type,
          };
        } else {
          ctx.status = 400;
          ctx.body = {
            error: error instanceof Error ? error.message : 'Error parsing request body',
            type: 'parse.error',
          };
        }
      }
    };
  }

  private hasBody(ctx: HttpContext): boolean {
    const method = ctx.method!.toUpperCase();
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return false;
    }

    const contentLength = this.getContentLength(ctx);

    if (isUndefined(contentLength) || contentLength === 0) {
      const transferEncoding = ctx.header.get('transfer-encoding');
      return transferEncoding !== undefined && transferEncoding.toLowerCase() === 'chunked';
    }

    if (contentLength > this.get('limit')) {
      throw BodyParserError.contentLengthExceeded(this.get('limit'));
    }
    return true;
  }
  private getContentLength(ctx: HttpContext): number | undefined {
    const header = ctx.header.get('content-length');
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

  private async readBody(ctx: HttpContext): Promise<string> {
    const req = ctx.req;
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      let size = 0;
      req.on('data', async (chunk: Buffer) => {
        chunks.push(chunk);
        size += chunk.length;
        const limit = this.get('limit');
        if (size > limit) {
          req.destroy();
          reject(BodyParserError.contentLengthExceeded(limit));
        }
      });

      req.on('end', async () => {
        if (chunks.length === 0) {
          resolve('');
          return;
        }
        const buffer = Buffer.concat(chunks);

        const verify = this.get('verify');
        if (verify) {
          try {
            verify(ctx, buffer, this.get('encoding'));
          } catch (err) {
            return reject(err);
          }
        }

        resolve(buffer);
      });

      req.on('error', (err: Error) => {
        reject(new BodyParserError(`Request stream error: ${err.message}`, 400, 'stream.error'));
      });

      req.on('aborted', () => {
        reject(BodyParserError.requestAborted());
      });

      const timeout = req.socket.timeout;
      if (timeout) {
        req.socket.setTimeout(timeout);
        req.socket.on('timeout', () => {
          reject(new Error('Request timeout'));
          req.destroy();
        });
      }
    });
  }

  private async parseJson(ctx: HttpContext): Promise<void> {
    try {
      const buffer = await this.readBody(ctx);
      const jsonConfig = this.get('json');

      if (isFalsy(buffer)) {
        ctx.body = {};
        return;
      }
      const rawBody = buffer.toString(this.get('encoding'));

      ctx.body = JSON.parse(rawBody, jsonConfig?.reviver);

      if (jsonConfig.strict && (isNil(ctx.body) || !isObject(ctx.body))) {
        throw BodyParserError.invalidJSON();
      }
    } catch (error) {
      if (error instanceof BodyParserError) {
        throw error;
      }

      throw BodyParserError.invalidJSON();
    }
  }

  private async parseText(ctx: HttpContext): Promise<void> {
    try {
      const buffer = await this.readBody(ctx);
      const encoding = this.get('encoding');
      ctx.body = buffer.toString(encoding);
    } catch (error) {
      if (error instanceof BodyParserError) {
        throw error;
      }

      throw new BodyParserError('Error parsing text body', 400, 'text.parse.error');
    }
  }
  private async parseUrlEncoded(ctx: HttpContext): Promise<void> {
    try {
      const buffer = await this.readBody(ctx);

      if (!buffer) {
        ctx.body = {};
        return;
      }
      const encoding = this.get('encoding');
      const urlEncodedOptions = this.get('urlencoded');

      const rawBody = buffer.toString(encoding);

      const paramCount = (rawBody.match(/&/g) || []).length + 1;
      if (urlEncodedOptions.parameterLimit && paramCount > urlEncodedOptions.parameterLimit) {
        throw BodyParserError.parameterLimitExceeded(urlEncodedOptions.parameterLimit);
      }

      if (urlEncodedOptions.extended) {
        ctx.body = this.parseExtendedUrlEncoded(rawBody);
      } else {
        ctx.body = this.parseSimpleUrlEncoded(rawBody);
      }
    } catch (error) {
      if (error instanceof BodyParserError) {
        throw error;
      }

      throw BodyParserError.invalidURLEncoded();
    }
  }

  private parseSimpleUrlEncoded(str: string): Dictionary<string> {
    const result: Dictionary<string> = {};

    if (!str || !isString(str)) {
      return result;
    }

    str.split('&').forEach((pair) => {
      const eq = pair.indexOf('=');

      if (eq < 1) {
        return;
      }

      const key = decodeURIComponent(pair.slice(0, eq).replace(/\+/g, ' '));
      const value = decodeURIComponent(pair.slice(eq + 1).replace(/\+/g, ' '));
      result[key] = value;
    });

    return result;
  }

  private parseExtendedUrlEncoded(str: string): Dictionary<any> {
    const result: Dictionary<any> = {};

    if (!str || typeof str !== 'string') {
      return result;
    }

    str.split('&').forEach((pair) => {
      const eq = pair.indexOf('=');

      if (eq < 1) {
        return;
      }

      const key = decodeURIComponent(pair.slice(0, eq).replace(/\+/g, ' '));
      const value = decodeURIComponent(pair.slice(eq + 1).replace(/\+/g, ' '));

      this.parseComplexKey(result, key, value);
    });

    return result;
  }

  private parseComplexKey(obj: Dictionary<any>, key: string, value: string): void {
    if (!key.includes('[')) {
      obj[key] = value;
      return;
    }

    const rootEnd = key.indexOf('[');
    const rootKey = key.substring(0, rootEnd);

    const path = key.substring(rootEnd);
    const segments = this.parseKeySegments(path);

    if (obj[rootKey] === undefined) {
      obj[rootKey] = segments[0].isArray ? [] : {};
    }

    let current = obj[rootKey];

    for (let i = 0; i < segments.length - 1; i++) {
      const { isArray, key: segment } = segments[i];
      const nextIsArray = segments[i + 1].isArray;

      if (isArray) {
        if (!Array.isArray(current)) {
          current = [];
          if (i === 0) obj[rootKey] = current;
        }

        const idx = segment === '' ? current.length : parseInt(segment, 10);

        if (isNaN(idx) || idx < 0) {
          throw new BodyParserError(`Invalid array index in key: ${key}`, 400, 'invalid.key');
        }

        if (current[idx] === undefined) {
          current[idx] = nextIsArray ? [] : {};
        }

        current = current[idx];
      } else {
        if (Array.isArray(current)) {
          throw new BodyParserError(`Cannot use a string key with an array at '${key}'`, 400, 'invalid.key');
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
        if (segments.length === 1) obj[rootKey] = current;
      }

      if (lastSegment.key === '') {
        current.push(value);
      } else {
        const idx = parseInt(lastSegment.key, 10);

        if (isNaN(idx) || idx < 0) {
          throw new BodyParserError(`Invalid array index in key: ${key}`, 400, 'invalid.key');
        }

        current[idx] = value;
      }
    } else {
      if (Array.isArray(current)) {
        throw new BodyParserError(`Cannot use a string key with an array at '${key}'`, 400, 'invalid.key');
      }

      current[lastSegment.key] = value;
    }
  }

  private parseKeySegments(path: string): Array<{ isArray: boolean; key: string }> {
    const segments: Array<{ isArray: boolean; key: string }> = [];
    const keyRegex = /\[([^\]]*)\]/g;
    let match: RegExpExecArray | null;

    while ((match = keyRegex.exec(path)) !== null) {
      const key = match[1];
      const isArray = key === '' || !isNaN(parseInt(key, 10));
      segments.push({ isArray, key });
    }

    return segments;
  }
}
