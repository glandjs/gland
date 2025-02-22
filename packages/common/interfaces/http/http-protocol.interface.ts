import { HttpStatus, RequestMethod } from '../../enums';

export interface IHttpProtocol {
  send<T>(body: T): void;
  redirect(url: string, status: HttpStatus): void;
  end(cb?: () => void): this;
  end(chunk: any, cb?: () => void): this;
  end(chunk: any, encoding: BufferEncoding, cb?: () => void): this;
  isFresh(): boolean;
  // Response helpers
  get status(): HttpStatus;
  set status(code: HttpStatus);
  get isSent(): boolean;
  get isFinished(): boolean;
  get method(): RequestMethod | undefined;
}
