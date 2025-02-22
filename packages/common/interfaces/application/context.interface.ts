import { IncomingMessage, ServerResponse } from 'http';
import { ParsedBody, QualifiedEvent } from '../../types';
import { HeaderOperations, IHttpProtocol } from '../http';
import { HttpStatus } from '@gland/common/enums';
import { HttpExceptionOptions } from '@gland/common/exceptions';
export interface ContextImpl {
  req: IncomingMessage;
  res: ServerResponse;
  params?: { [key: string]: string };
  ip?: string;
  query?: Record<string, string | number | undefined>;
  error?: unknown;
  body?: ParsedBody['body'];
  state?: Record<string, any>;
  get url(): string | undefined;
  json<T>(body: T): void;
  emit<T extends string, D, R>(event: QualifiedEvent<T>, data?: D): R;
  request<T extends string, D>(event: QualifiedEvent<T>, data?: D): Promise<void>;

  get responded(): boolean;
  get header(): HeaderOperations;
  throw(status: HttpStatus, options?: HttpExceptionOptions): void;
  cookies?: Record<string, string>;
}
export interface Context extends ContextImpl, Pick<IHttpProtocol, 'send' | 'redirect' | 'status' | 'method' | 'end'> {}
