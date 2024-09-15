# Overview of @medishn/gland

`@medishn/gland` is a lightweight, modular web framework designed to streamline the development of Node.js applications. Built for developers who value performance, flexibility, and ease of use, `gland` offers a powerful foundation for building APIs, web services, and other web applications.

## Key Features

1. **Modular Architecture**: `gland` adopts a modular design, allowing developers to load and configure routes, middleware, and other components dynamically through a simple configuration file (`.confmodule`).

2. **Routing with Decorators**: Define your routes using TypeScript decorators like `@Get()`, `@Post()`, `@Put()`, `@Delete()`, and `@Route()`. This makes your code cleaner and more declarative.

3. **Middleware Support**: Add and manage middleware easily at both global and route levels. Middleware functions can intercept and manipulate requests and responses, providing flexibility in handling authentication, logging, and more.

4. **Integrated Logger**: `gland` comes with an integrated logger from the `@medishn/gland-logger` package, allowing for seamless logging with customizable log levels. Whether logging to the console or implementing more advanced logging strategies, the logger provides robust support for tracking and debugging.

5. **SQL Database Support**: `gland` natively integrates with SQL databases (MySQL, PostgreSQL, MariaDB) via `@medishn/gland-qiu`. This query runner supports database interaction and simplifies common operations with SQL databases, making it easier to connect, query, and manage your database.

6. **Configuration through `.confmodule`**: The framework provides an easy-to-use configuration system that allows you to load routes, configure logging levels, and set middleware through a configuration module. This approach ensures flexibility and scalability for projects of any size.

7. **Task Queue**: `gland` includes an internal task queue system, allowing asynchronous tasks to be handled efficiently. This is ideal for handling complex tasks in the background without blocking the main event loop.

8. **Performance-Focused**: Optimized for performance, `gland` can process a high volume of requests with minimal overhead. Recent benchmarks show exceptional performance with low average response times, even under heavy loads.

## Use Cases

- **API Development**: Perfect for building RESTful APIs or GraphQL backends with support for decorators and middleware.
- **Web Services**: Build microservices with ease, leveraging the modular architecture to scale your services independently.
- **Enterprise Applications**: With SQL database integration and robust logging, `gland` is well-suited for large-scale enterprise applications.

## Example

Here’s a simple example of how to use `gland` to create a basic web server:

```typescript
import path from 'path';
import gland from '@medishn/gland';

const app = new gland();
app.load(path.join(__dirname, '.confmodule'));

app.init(3000, () => {
  console.log('Server is running on port 3000');
});
```

In the configuration file (`.confmodule`), define the path to your routes and other settings:

```ini
path=router
```

And in your routing module:

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

## Internal Components

### **Logger (`@medishn/gland-logger`)**
`gland` uses an internal logger for detailed logging and debugging. The logger is highly customizable, allowing you to control log levels and output formatting. It supports features like file rotation and caching.

For more information, visit the [gland-logger repository](https://github.com/medishen/gland-logger).

### **SQL Query Runner (`@medishn/gland-qiu`)**
For applications requiring SQL database support, `gland` provides `Qiu`, an integrated SQL query runner that simplifies database interactions. It supports MySQL, PostgreSQL, and MariaDB.

For more details, see the [gland-qiu repository](https://github.com/medishen/gland-qiu).

## Conclusion

`@medishn/gland` is a versatile and efficient framework that helps developers build modern web applications with ease. Its modular design, performance optimizations, and built-in support for logging and database management make it an excellent choice for both small projects and large-scale enterprise applications.