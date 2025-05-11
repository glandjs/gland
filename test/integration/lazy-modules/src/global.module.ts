import { Channel, Module, On } from '@glandjs/common';
import type { HttpContext } from '@glandjs/http';

@Channel()
class GlobalChannel {
  OnInit() {}

  @On('send')
  send(ctx: HttpContext) {
    ctx.send('Hello World');
  }
}

@Module({
  channels: [GlobalChannel],
  exports: [GlobalChannel],
})
export class GlobalModule {}
