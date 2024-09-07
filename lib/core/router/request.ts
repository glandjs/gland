import { Factory } from '@medishn/gland-logger';
import { IncomingMessage } from 'http';
const logger = new Factory({ transports: ['console'], level: 'warn' });
const PROTO = IncomingMessage.prototype;
PROTO.json = function (): Promise<object | undefined> {
  return new Promise((resolve, reject) => {
    let body = '';
    this.on('data', (chunk) => {
      body += chunk;
    });
    this.on('end', () => {
      if (!body) {
        logger.log('Request body is empty.', 'warn');
        resolve(undefined);
      } else {
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(new Error('Invalid JSON format.'));
        }
      }
    });
    this.on('error', (error) => {
      reject(error);
    });
  });
};
