import { Controller, Get, ServerRequest } from '../../../../dist';

@Controller('/')
export class HomeController {
  @Get('/')
  index(ctx: ServerRequest): void {
    ctx.send('Welcome to the Gland Framework!');
  }
}
