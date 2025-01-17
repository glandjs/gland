import { Injectable } from '../../../../dist';

@Injectable()
export class UserService {
  private users: Record<string, any>[] = [
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
  ];

  getAllUsers(): Promise<Record<string, any>[]> {
    return Promise.resolve(this.users);
  }

  getUserById(id: string): Promise<Record<string, any> | null> {
    return Promise.resolve(this.users.find((user) => user.id === id) || null);
  }

  createUser(user: Record<string, any>): Promise<Record<string, any>> {
    const newUser = { id: String(this.users.length + 1), ...user };
    this.users.push(newUser);
    return Promise.resolve(newUser);
  }
}
