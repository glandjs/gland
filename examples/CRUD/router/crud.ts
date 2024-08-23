import { exposed, Get, Route, Delete, Post, Put, Context } from '../../../index';
import p from 'path';
import * as fs from 'fs';
const db = p.join(__dirname, '..', 'db', 'db.json');
const usersData: Users = JSON.parse(fs.readFileSync(db, 'utf-8'));
interface User {
  id: number;
  name: string;
  role: string;
}
interface Users {
  users: User[];
}
@Route('/')
@exposed
class CRUD {
  @Get()
  get(ctx: Context) {
    ctx.writeHead(200, {
      'Content-Type': 'application/json',
    });
    ctx.write(JSON.stringify(usersData));
    ctx.end();
  }
  @Post()
  post(ctx: Context) {
    const { name } = ctx.body as { name: string };

    // Find the last user's ID and increment it for the new user
    const newId = usersData.users[usersData.users.length - 1].id + 1;

    // Create a new user object
    const newUser = {
      id: newId,
      name: name,
      role: 'member', // fixed typo from 'memebr' to 'member'
    };

    // Add the new user to the users array
    usersData.users.push(newUser);

    // Convert users object to a JSON string and write it back to the file
    fs.writeFileSync(db, JSON.stringify(usersData), 'utf-8');

    // Send the response
    ctx.writeHead(200, {
      'Content-Type': 'application/json',
    });
    ctx.write(JSON.stringify(newUser));
    ctx.end();
  }
  @Delete()
  del(ctx: Context) {
    const { name } = ctx.body as { name: string };

    // Parse the existing users from the db.json file
    const usersData = JSON.parse(fs.readFileSync(db, 'utf-8'));

    // Filter out the user to be deleted
    usersData.users = usersData.users.filter((user: User) => user.name !== name);

    // Write the updated usersData back to the file
    fs.writeFileSync(db, JSON.stringify(usersData), 'utf-8');
    ctx.writeHead(200, {
      'Content-Type': 'application/json',
    });
    ctx.write(JSON.stringify(usersData.users));
    ctx.end();
  }
  @Put()
  put(ctx: Context) {
    const { name, newName } = ctx.body as { name: string; newName: string };

    // Parse the existing users from the db.json file
    const usersData = JSON.parse(fs.readFileSync(db, 'utf-8'));

    // Find the user by the current name
    const user = usersData.users.find((user: User) => user.name === name);

    if (user) {
      // Update the user's name
      user.name = newName;

      // Write the updated usersData back to the file
      fs.writeFileSync(db, JSON.stringify(usersData), 'utf-8');

      // Send the response with the updated user
      ctx.writeHead(200, {
        'Content-Type': 'application/json',
      });
      ctx.write(JSON.stringify(user));
    } else {
      // If user not found, send a 404 response
      ctx.writeHead(404, {
        'Content-Type': 'application/json',
      });
      ctx.write(JSON.stringify({ message: 'User not found' }));
    }

    ctx.end();
  }
}
