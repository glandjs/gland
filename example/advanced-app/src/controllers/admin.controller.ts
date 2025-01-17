import { Controller, Get, Inject, Middleware, ServerRequest } from '../../../../dist';
import { authMiddleware } from '../middlewares/auth.middleware';
import { AdminService } from '../services/admin.service';

@Controller('/admin')
@Middleware(authMiddleware)
export class AdminController {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  @Get('/dashboard')
  getDashboard(): {
    users: number;
    revenue: number;
  } {
    return this.adminService.getDashboardData();
  }
}
