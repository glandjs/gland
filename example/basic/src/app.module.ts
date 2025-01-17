import { Module } from '../../../dist';
import { HomeController } from './controllers/home.controller';
import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';

@Module({
  controllers: [HomeController, UserController],
  providers: [
    {
      provide: UserService,
      useClass: UserService,
      scope: 'singleton',
    },
  ],
})
export class AppModule {}
