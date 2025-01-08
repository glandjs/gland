import { HttpContext } from '../types';
import { Router } from './Router';

export class RouterManager {
  private router: Router;
  constructor(apiPrefix: string) {
    this.router = new Router(apiPrefix);
  }
  registerControllers(controllers: Function[]): void {
    controllers.forEach((controller) => this.router.registerController(controller));
  }
  getRouter(): Router {
    return this.router;
  }
  async run(ctx: HttpContext) {
    await this.router.run(ctx);
  }
}
