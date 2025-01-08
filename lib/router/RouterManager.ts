import { Router } from './Router';
import { HttpContext } from 'node:http';

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
  run(ctx: HttpContext) {
    this.router.run(ctx);
  }
}
