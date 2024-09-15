# FAQ

## What is Gland?

Gland is a lightweight web server framework designed for Node.js. It provides a flexible and extensible way to build web applications with support for middleware, routing, and a modular approach to configuration.

## How do I get started with Gland?

To get started with Gland, you can follow these simple steps:

1. Install Gland via npm:

   ```bash
   npm install @medishn/gland
   ```

2. Create a basic server:

   ```typescript
   import path from 'path';
   import gland from '@medishn/gland';

   const g = new gland();
   g.load(path.join(__dirname, '.confmodule'));
   g.init(3000, () => {
     console.log('Server running on port 3000');
   });
   ```

3. Define your routes and handlers in a configuration file (`.confmodule`):

   Create a `.confmodule` file with the following content:

   ```
   path=router
   ```

4. Create Router:(/router/example.ts)

   ```typescript
   import { Context, Get, Route } from '@medishn/gland';

   @Route('/')
   export class Test {
     @Get()
     test(ctx: Context) {
       ctx.write('hello world');
       ctx.end();
     }
   }
   ```

## How does Gland handle logging?

Gland uses the internal logger package, [@medishn/gland-logger](https://github.com/medishen/gland-logger), to handle logging. You can access the logger using the `logger` property:

```typescript
import gland from '@medishn/gland';

const g = new gland();
const logger = new g.logger();
```

## What is Qiu?

Qiu is an internal query runner for Gland that supports various SQL databases, including MySQL, MariaDB, and PostgreSQL. For more information, visit the [Qiu repository](https://github.com/medishen/gland-qiu).

## Where can I find more information?

- [Gland Repository](https://github.com/medishen/gland)
- [Gland Logger](https://github.com/medishen/gland-logger)
- [Qiu](https://github.com/medishen/gland-qiu)

## How can I report issues or contribute?

Please report issues and contribute to the Gland project via the [GitHub repository](https://github.com/medishen/gland). For contributions, see the `CONTRIBUTING.md` file for guidelines.

## Contact

For further inquiries, you can reach us at [bitsgenix@gmail.com](mailto:bitsgenix@gmail.com).
