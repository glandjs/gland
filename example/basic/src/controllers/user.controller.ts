import { Controller, Get, Inject, Post, ServerRequest } from '../../../../dist';
import { UserService } from '../services/user.service';

@Controller('/user')
export class UserController {
  constructor(@Inject(UserService) private readonly userService: UserService) {}

  @Get('/')
  async getAllUsers(ctx: ServerRequest): Promise<void> {
    const users = await this.userService.getAllUsers();
    console.log('users:', users);
    ctx.send(users);
  }

  @Get('/:id')
  async getUserById(ctx: ServerRequest): Promise<void> {
    const id = ctx.params.id;
    const user = await this.userService.getUserById(id);
    ctx.send(user);
  }

  @Post('/')
  async createUser(ctx: ServerRequest): Promise<void> {
    const body = ctx.body;
    const newUser = await this.userService.createUser(body);
    ctx.status = 201;
    ctx.send(newUser);
  }
}
