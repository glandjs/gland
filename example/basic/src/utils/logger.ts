import { Logger } from '@medishn/logger';
export class AppLogger {
  logger: Logger;
  constructor() {
    this.logger = new Logger();
  }
}

export const appLogger = new AppLogger().logger;
