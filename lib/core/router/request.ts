import { IncomingMessage } from 'http';
const PROTO = IncomingMessage.prototype;
PROTO.json = function (): Promise<object> {
  return new Promise((resolve, reject) => {
    let body = '';
    this.on('data', (chunk) => {
      body += chunk;
    });
    this.on('end', () => {
      resolve(JSON.parse(body));
    });
    this.on('error', (error) => {
      reject(error);
    });
  });
};
