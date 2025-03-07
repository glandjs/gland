import { ProtocolType } from '@gland/common/types';

/**
 * HTTP-specific arguments accessor
 */
export interface HttpArgumentsHost {
  /**
   * Returns the incoming request object
   */
  getRequest<T = any>(): T;

  /**
   * Returns the outgoing response object
   */
  getResponse<T = any>(): T;

  /**
   * Returns the next middleware function
   */
  getNext<T = any>(): T;
}

/**
 * WebSocket-specific arguments accessor
 */
export interface WsArgumentsHost {
  /**
   * Returns the message data
   */
  getData<T = any>(): T;

  /**
   * Returns the client connection
   */
  getClient<T = any>(): T;

  /**
   * Returns the event pattern/type that triggered this handler
   */
  getPattern(): string;
}

/**
 * Provides methods for retrieving handler arguments across different protocols
 */
export interface ArgumentsHost<T extends ProtocolType> {
  /**
   * Returns all arguments being passed to the handler
   */
  getArgs<T extends Array<any> = any[]>(): T;

  /**
   * Returns a specific argument by index
   * @param index Index of the argument to retrieve
   */
  getArgByIndex<T = any>(index: number): T;

  /**
   * Switch context to HTTP protocol
   */
  switchToHttp(): HttpArgumentsHost;

  /**
   * Switch context to WebSocket protocol
   */
  switchToWs(): WsArgumentsHost;

  /**
   * Returns the current execution context type
   */
  getType(): T;
}
