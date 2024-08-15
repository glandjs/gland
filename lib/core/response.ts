import { IncomingMessage, ServerResponse } from 'http';

export class Response extends ServerResponse {
  private response: ServerResponse;
  constructor(res: ServerResponse, req: IncomingMessage) {
    super(req);
    this.response = res;
  }
  send(body: any): this {
    try {
      if (typeof body === 'string' || Buffer.isBuffer(body)) {
        this.response.write(body);
      } else if (body !== null && typeof body === 'object') {
        this.response.setHeader('Content-Type', 'application/json');
        this.response.write(JSON.stringify(body));
      } else {
        this.response.setHeader('Content-Type', 'text/plain');
        this.response.write(String(body));
      }
    } catch (error) {
      console.error('Error sending response:', error);
      this.response.writeHead(500, { 'Content-Type': 'text/plain' });
      this.response.write('Internal Server Error');
    } finally {
      this.response.end();
    }

    return this;
  }
  json(data: any): this {
    this.response.setHeader('Content-Type', 'application/json');
    this.response.write(JSON.stringify(data));
    this.response.end();
    return this;
  }
}
