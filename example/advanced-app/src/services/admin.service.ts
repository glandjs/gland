import { Injectable } from '../../../../dist';

@Injectable()
export class AdminService {
  getDashboardData() {
    return {
      users: 1200,
      revenue: 54000,
    };
  }
}
