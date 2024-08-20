import { IncomingMessage } from 'http';
import { logger } from '../../helper/logger';
const PROTO = IncomingMessage.prototype;
PROTO.json = function (): Promise<object | undefined> {
  return new Promise((resolve, reject) => {
    let body = '';
    this.on('data', (chunk) => {
      body += chunk;
    });
    this.on('end', () => {
      if (!body) {
        logger.warn('Request body is empty.');
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
