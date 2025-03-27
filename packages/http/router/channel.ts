import { RequestMethod } from '@glandjs/common';
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
  onMatch(action: (ctx: HttpContext) => Maybe<RouteMatch>) {
    this.channel.respond(RouterEvent.MATCH, (ctx: HttpContext) => {
      return action(ctx);
    });
  }
  onRegister(action: (data: RegisterType) => void) {
    this.channel.on<RegisterType>(RouterEvent.REGISTER, (data) => {
      return action(data);
    });
  }

  match(ctx: HttpContext): RouteMatch {
    return this.channel.request<RouteMatch>(RouterEvent.MATCH, ctx, 'first')!;
  }

  register(method: RequestMethod, path: string, action: RouteAction): void {
    this.channel.emit(RouterEvent.REGISTER, { method, path, action });
  }
}
