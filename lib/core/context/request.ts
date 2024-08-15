import { IncomingMessage } from 'http';
import { URLParser } from '../../helper';
import tls from 'tls';
export class Request<T extends Record<string, string>> extends IncomingMessage {
  private urlParser: URLParser<T>;
  constructor(req: IncomingMessage) {
    super(req.socket);
    this.url = req.url || '/';
    this.method = req.method || 'GET';
    this.headers = req.headers || {};
    const protocol = req.socket instanceof tls.TLSSocket ? 'https' : 'http';
    const host = req.headers.host || 'localhost';

    this.urlParser = new URLParser<T>(this.url!, `${protocol}://${host}`);
  }

  get params(): T {
    return this.urlParser.getParams();
  }

  get queries(): Record<string, string> {
    return this.urlParser.getQueries();
  }

  get hostname(): string | undefined {
    return this.headers.host?.split(':')[0];
  }

  get protocol(): string {
    return (this.socket as any).encrypted ? 'https' : 'http';
  }

  public getHeader(name: string) {
    const lowerCaseName = name.toLowerCase();
    return (
      this.headers[lowerCaseName as keyof IncomingMessage['headers']] ??
      (lowerCaseName === 'referer' || lowerCaseName === 'referrer'
        ? this.headers.referrer ?? this.headers.referer
        : undefined)
    );
  }
}
