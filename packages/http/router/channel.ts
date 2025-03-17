import { RequestMethod } from '@gland/common';
import { HttpEventCore } from '../adapter';
import { HttpContext, RouteAction, RouteMatch } from '../interface';
import { Maybe } from '@medishn/toolkit';

enum RouterEvent {
  MATCH = 'match',
  REGISTER = 'register',
}
type RegisterType = { method: RequestMethod; path: string; action: RouteAction };
export class RouterChannel {
  constructor(private channel: HttpEventCore) {}
  onMatch(handler: (ctx: HttpContext) => Maybe<RouteMatch>) {
    this.channel.respond(RouterEvent.MATCH, (ctx: HttpContext) => {
      return handler(ctx);
    });
  }
  onRegister(handler: (data: RegisterType) => void) {
    this.channel.on<RegisterType>(RouterEvent.REGISTER, (data) => {
      return handler(data);
    });
  }

  match(ctx: HttpContext): RouteMatch {
    return this.channel.request<RouteMatch>(RouterEvent.MATCH, ctx, 'first')!;
  }

  register(method: RequestMethod, path: string, action: RouteAction): void {
    this.channel.emit(RouterEvent.REGISTER, { method, path, action });
  }
}
