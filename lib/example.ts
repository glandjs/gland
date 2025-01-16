import { Application } from './core/Application';
import { Get } from './decorator/http';
import { Controller } from './decorator/Controller';
import { Injectable, Module, Inject } from './decorator/module/Module';
import { Guard } from './decorator/Guards';
import { Transform } from './decorator/Transform';
import { ServerRequest, TransformContext } from './common/interfaces';
@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
function routeMid(ctx: ServerRequest, nxt: Function) {
  console.log('Route:GET Middleware');
  nxt();
}
@Controller('/app')
export class AppController {
  constructor(@Inject(AppService) private readonly appService: AppService) {}

  @Get('/hello', [routeMid])
  getHello(ctx: ServerRequest): void {
    const text = this.appService.getHello();
    ctx.send(text);
  }
}

@Module({
  controllers: [AppController],
  providers: [
    {
      provide: AppService,
      useClass: AppService,
      scope: 'singleton',
    },
  ],
})
class AppModule {}

const app = Application.create(AppModule);
app.listen(3000, 'localhost', () => {
  console.log('Server Running on port 3000');
});
