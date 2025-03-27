import type { HttpContext } from '@glandjs/http';
import { Channel, Controller, Get, Module, On } from '@glandjs/common';
import { GlandFactory } from '@glandjs/core';

@Controller('users')
class UserController {
  @Get('/')
  createUser(ctx: HttpContext) {
    const data = 1;
    ctx.emit('user:created', { data, ctx });
  }
}

@Channel('users')
class UserChannel {
  @On('user:created')
  async handleUserCreated(payload: { ctx: HttpContext; data: any }) {
    const body = payload.data;
    const ctx = payload.ctx;
    ctx.emit('@response:send', { ctx, body });
  }
}

@Channel('response')
class ResponseChannel {
  @On('send')
  handleResponse({ ctx, body }: { ctx: HttpContext; body: any }) {
    ctx.send(body);
  }
}

@Module({
  channels: [UserChannel, ResponseChannel],
  controllers: [UserController],
})
class UserModule {}

@Module({
  imports: [UserModule],
})
class AppModule {}

async function bootstrap() {
  const app = await GlandFactory.create(AppModule);
  app.listen(3000);
}
bootstrap();
