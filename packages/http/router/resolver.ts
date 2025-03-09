import { HttpContext, RouteAction } from '../interface';
export class RouterResolver {
  constructor() {}

  public resolve(instance: any, action: RouteAction): RouteAction {
    return (ctx: HttpContext) => {
      return action.apply(instance, [ctx]);
    };
  }
}
