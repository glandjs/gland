# Basic Application Example

This example covers the following core features:

- Controllers and decorators for routing
- Services for business logic separation
- Application configuration

### Core Features of the Example App

1. **Controllers and Routing**:

   - `home.controller.ts`: This file demonstrates how to create routes and handle HTTP requests using the `@Controller` decorator.
   - `user.controller.ts`: Another example of a controller that handles user-related routes.

2. **Services**:

   - `user.service.ts`: A service for handling business logic, such as user operations.

3. **Configuration**:

   - `app.config.ts`: Configuration file to handle application-wide settings, such as environment variables and server settings.

### Getting Started

To start using this example app, follow these steps:

1. Clone this repository.
2. Run the following commands to install dependencies:

```bash
npm install
```

3. Start the server:

```bash
npm run dev
```

4. The application should now be running on `http://localhost:3000`. You can access different routes (like `/home` and `/user`) as defined in the controllers.
