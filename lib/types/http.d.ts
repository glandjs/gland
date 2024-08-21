import { IncomingMessage, ServerResponse } from 'http';

declare module 'http' {
  interface IncomingMessage {
    json(): Promise<object | undefined>;
  }

  interface ServerResponse {
    clearCookie(name: string): this;
    cookie(name: string, value: string, options?: CookieOptions): this;
    redirect(url: string, statusCode?: number): void;
    render(view: string, options?: object, callback?: (err: Error | null, html?: string) => void): void;
  }
  interface CookieOptions {
    expires?: Date;
    maxAge?: number;
    domain?: string;
    path?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
  }
}
