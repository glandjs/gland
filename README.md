# Gland

`Gland` is a lightweight and extensible web server framework for Node.js. It provides a flexible and modular approach to building web applications, including support for middleware, routing, logging, and SQL query execution.

## Features

- **Modular Configuration**: Load and configure modules dynamically.
- **Middleware Support**: Easily add and manage middleware functions.
- **Routing**: Define routes using decorators for different HTTP methods.

## Installation

You can install `@medishn/gland` via npm:

```bash
npm install @medishn/gland
```

## Basic Usage

To get started with `@medishn/gland`, follow these steps:

1. **Create a Basic Server**

   ```typescript
   import path from 'path';
   import gland from '@medishn/gland';

   const g = new gland();
   g.load(path.join(__dirname, '.confmodule'));
   g.init(3000, () => {
     console.log('Server running on port 3000');
   });
   ```

2. **Define Routes and Handlers**

   Create a `.confmodule` file with the following content:

   ```
   path=router
   ```

3. **Create Router:(/router/example.ts)**
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

## Middleware

You can add middleware functions to your Gland instance:

```typescript
import gland, { Context,NxtFunction } from '@medishn/gland';

const g = new gland();

const myMiddleware = async (ctx: Context, next: NxtFunction) => {
  // Middleware logic here
  await next();
};

g.use(myMiddleware);
```

## Routing

Define routes using decorators:

```typescript
import { Context, Get, Post, Route } from '@medishn/gland';

@Route('/example')
export class Example {
  @Get()
  getExample(ctx: Context) {
    ctx.write('GET request');
    ctx.end();
  }

  @Post()
  postExample(ctx: Context) {
    ctx.write('POST request');
    ctx.end();
  }
}
```

## Contributing

We welcome contributions to the Gland project. Please follow these steps:

1. Fork the repository.
2. Clone your fork and create a new branch.
3. Make your changes and write tests.
4. Commit your changes with a descriptive message.
5. Push your changes and create a pull request.

For more details, see the [CONTRIBUTING.md](docs/CONTRIBUTING.md).

## Security

For information on security practices and reporting vulnerabilities, please refer to [SECURITY.md](docs/SECURITY.md).

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact

For any questions or further assistance, please reach out to us at [bitsgenix@gmail.com](mailto:bitsgenix@gmail.com).