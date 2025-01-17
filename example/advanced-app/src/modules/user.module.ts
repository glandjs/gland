import { AdminController } from '../controllers/admin.controller';
import { AdminService } from '../services/admin.service';
import { Module } from '../../../../dist';

@Module({
  controllers: [AdminController],
  providers: [
    {
      provide: AdminService,
      useClass: AdminService,
    },
  ],
})
export class UserModule {}
