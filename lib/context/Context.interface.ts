import { Stream } from 'stream';
import { HttpStatus } from '../common/enums/status.enum';

// Success response type
export interface SuccessResponse<T = any> {
  status?: 'success'; // Success status
  data: T | null; // Payload data
  message?: string; // Optional message
  statusCode?: HttpStatus; // HTTP status code (e.g., 200)
}

// Error response type
export interface ErrorResponse {
  status?: 'error'; // Error status
  message?: string; // Error message
  statusCode: HttpStatus; // HTTP status code (e.g., 400)
  stack?: string; // Optional stack trace (for development environments)
}

// General ResponseBody Type
export type ResponseBody<T = any> = SuccessResponse<T> | ErrorResponse | string | Buffer | Stream;
