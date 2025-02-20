import { HttpStatus } from '../enums/http/status.enum';
import { HTTP_ERRORS } from '../http-errors.const';
type ProblemDetails = {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  [key: string]: unknown;
};
export interface HttpExceptionOptions {
  /**
   * A URI reference identifying the problem type.
   */
  type?: string;

  /**
   * A short, human-readable summary of the problem.
   * @default HTTP_ERRORS[status].message
   */
  title?: string;

  /**
   * A human-readable explanation of the problem.
   * @default HTTP_ERRORS[status].description
   */
  detail?: string;

  /**
   * A URI reference identifying the specific occurrence of the problem.
   */
  instance?: string;

  /**
   * Additional context-specific information about the error.
   */
  [key: string]: unknown;
}

export class HttpException extends Error {
  public readonly type: string;
  public readonly title: string;
  public readonly status: HttpStatus;
  public readonly detail?: string;
  public readonly instance?: string;
  public readonly extensions: Omit<ProblemDetails, 'type' | 'title' | 'status' | 'detail' | 'instance'>;

  constructor(status: HttpStatus, options: HttpExceptionOptions = {}) {
    const statusCode = Object.values(HttpStatus).includes(status) ? status : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorConfig = Object.values(HTTP_ERRORS).find((config) => config.status === statusCode)!;
    super(options.detail ?? errorConfig.description);

    this.name = 'HttpException';
    this.type = options.type ?? 'error';
    this.title = options.title ?? errorConfig.message;
    this.status = statusCode;
    this.detail = options.detail;
    this.instance = options.instance;

    this.extensions = {
      errors: options.errors,
      ...options,
    };

    Error.captureStackTrace(this, this.constructor);
  }

  getProblemDetails(requestId?: string): ProblemDetails {
    return {
      type: this.type,
      title: this.title,
      status: this.status,
      ...(this.detail && { detail: this.detail }),
      ...(this.instance && { instance: this.instance }),
      ...(requestId && { traceId: requestId }),
      ...this.extensions,
    };
  }

  toJSON(): ProblemDetails {
    return this.getProblemDetails();
  }
  static create(status: HttpStatus, detail?: string, extensions?: Record<string, unknown>): HttpException {
    return new HttpException(status, { detail, extensions });
  }
}
