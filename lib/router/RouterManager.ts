import { EventSystemManager } from '../events/EventSystemManager';
import { ServerRequest } from '../types';
import { Router } from './Router';

export class RouterManager {
  private router: Router;
  constructor(apiPrefix: string, events: EventSystemManager) {
    this.router = new Router(apiPrefix, events);
  }
  registerControllers(controllers: Function[]): void {
    controllers.forEach((controller) => this.router.registerController(controller));
  }
  getRouter(): Router {
    return this.router;
  }
  async run(ctx: ServerRequest) {
    await this.router.run(ctx);
  }
}
