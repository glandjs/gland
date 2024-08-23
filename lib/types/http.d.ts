import { IncomingMessage, ServerResponse } from 'http';

declare module 'http' {
  interface IncomingMessage {
    json(): Promise<object | undefined>;
  }
}
