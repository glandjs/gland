import { Channel, Module, On } from '@glandjs/common';

export interface User {
  id: string;
  name: string;
}

const users: User[] = [
  { id: 'u1', name: 'Ada Lovelace' },
  { id: 'u2', name: 'Grace Hopper' },
];

/**
 * The user directory, addressed as `users:*`.
 *
 * Separate from the catalogue on purpose: two modules contributing channels
 * with the same event suffix stay unambiguous because the namespace is part of
 * the name. `users:find` and `catalog:find` are different events.
 */
@Channel('users')
export class UsersChannel {
  onModuleInit(): void {
    console.log('[UsersChannel] onModuleInit');
  }

  @On('find')
  find(id: string): User | null {
    return users.find((user) => user.id === id) ?? null;
  }

  @On('count')
  count(): number {
    return users.length;
  }
}

/** No hooks here — participating in the graph does not require them. */
@Module({ channels: [UsersChannel] })
export class UsersModule {}
