import { IncomingMessage } from 'http';
import { URL } from 'url';
import { URLParams } from '../types/types';

class URLParser<T extends Record<string, string>> {
  private url: URL;
  private pattern: string;
  private params: URLParams<T> = {} as URLParams<T>;
  private queries: Record<string, string> = {};

  constructor(urlString: string, host: string, pattern: string) {
    this.url = new URL(urlString, `http://${host}`);
    this.pattern = pattern;
    this.extractParams();
    this.extractQueries();
  }

  private extractParams() {
    const pathParts = this.url.pathname.split('/').filter(Boolean);
    const patternParts = this.pattern.split('/').filter(Boolean);

    patternParts.forEach((part, index) => {
      if (part.startsWith(':')) {
        const key = part.substring(1) as keyof URLParams<T>;
        if (pathParts[index]) {
          this.params[key] = pathParts[index] as URLParams<T>[typeof key];
        }
      }
    });
  }

  private extractQueries() {
    this.url.searchParams.forEach((value, key) => {
      this.queries[key] = value;
    });
  }

  getParams(): URLParams<T> {
    return this.params;
  }

  getQueries(): Record<string, string> {
    return this.queries;
  }
}

class Request<T extends Record<string, string>> extends IncomingMessage {
  private urlParser: URLParser<T>;

  constructor(req: IncomingMessage, pattern: string) {
    // Initialize the parent class
    super(req.socket);
    // Ensure the instance properties are correctly set
    this.url = req.url;
    this.method = req.method;
    this.headers = req.headers;
    this.urlParser = new URLParser<T>(this.url!, this.headers.host || '', pattern);
  }

  get params(): URLParams<T> {
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

  get(name: string) {
    switch (name.toLowerCase()) {
      case 'referer':
      case 'referrer':
        return this.headers.referrer || this.headers.referer;
      default:
        return this.headers[name.toLowerCase()];
    }
  }
}
