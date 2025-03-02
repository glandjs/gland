# Contributing to Gland

We’re excited that you’re interested in contributing to **Gland**! As a fully **event-driven framework**, Gland is designed to be lightweight, modular, and flexible. Your contributions can help shape its future and make it even better for developers worldwide.

**Before contributing**, please read this guide thoroughly. It ensures we maintain consistency across the framework while fostering an open, collaborative environment.

---

## Table of Contents

- [Contributing to Gland](#contributing-to-gland)
  - [Table of Contents](#table-of-contents)
  - [ Code of Conduct](#-code-of-conduct)
  - [ Support Questions](#-support-questions)
  - [ Getting Started](#-getting-started)
    - [Prerequisites](#prerequisites)
    - [Clone the Repository](#clone-the-repository)
  - [ Reporting Issues](#-reporting-issues)
  - [ Feature Requests](#-feature-requests)
  - [ Submitting Pull Requests](#-submitting-pull-requests)
  - [ Development Setup](#-development-setup)
    - [Running the Project](#running-the-project)
    - [Common Scripts](#common-scripts)
  - [ Coding Guidelines](#-coding-guidelines)
  - [ Commit Message Format](#-commit-message-format)
    - [Allowed Types](#allowed-types)
  - [Thank You!](#thank-you)

---

## <a name="code-of-conduct"></a> Code of Conduct

Gland is committed to fostering an inclusive and respectful community. All contributors are expected to adhere to our Code of Conduct, which promotes a harassment-free experience for everyone. Please read the [Code of Conduct](CODE_OF_CONDUCT.md) before participating.

**Violations will not be tolerated.** Report issues to bitsgenix@gmail.com.

---

## <a name="support"></a> Support Questions

**Do not create GitHub issues for general questions.** Instead:

- Use [Stack Overflow](https://stackoverflow.com) with the `gland` tag
- Join our [Discord Community](#) for real-time discussions (coming soon)
- Check our [Documentation](#) (coming soon)

## <a name="getting-started"></a> Getting Started

### Prerequisites

- **Node.js**: Ensure you have Node.js installed (version 18 or higher).
- **Git**: Familiarity with Git and GitHub workflows is required.
- **TypeScript**: Gland is built with TypeScript, so a basic understanding is helpful.

### Clone the Repository

1. Fork the [Gland repository](https://github.com/your-username/gland).
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/gland.git
   cd gland
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

---

## <a name="reporting-issues"></a> Reporting Issues

If you encounter a bug or have a question, please follow these steps:

1. **Search Existing Issues**: Check if the issue has already been reported.
2. **Create a New Issue**: If it hasn’t, open a new issue with the following details:
   - A clear title and description.
   - Steps to reproduce the issue.
   - Expected vs. actual behavior.
   - Relevant code snippets or screenshots (if applicable).
   - Your environment (Node.js version, OS, etc.).

**Note**: For general questions, please use [Stack Overflow](https://stackoverflow.com) with the tag `gland`.

Want real-time discussion? Join our [Discord community](#) (coming soon!).

---

## <a name="feature-requests"></a> Feature Requests

1. **Open an Issue**: Describe the feature and its benefits.
2. **Discuss**: We’ll review the proposal and provide feedback.
3. **Implement**: If approved, you can submit a pull request (see below).

---

## <a name="submitting-pull-requests"></a> Submitting Pull Requests

1. **Fork the Repository**: Create a fork of the Gland repository.
2. **Create a Branch**:
   ```bash
   git checkout -b my-feature-branch
   ```
3. **Make Your Changes**: Follow the [Coding Guidelines](#coding-guidelines).
4. **Test Your Changes**: Ensure all tests pass and add new tests if needed. (Mocha&Chai preferred)
5. **Commit Your Changes**: Use a descriptive commit message (see [Commit Message Format](#commit-message-format)).
6. **Push Your Branch**:
   ```bash
   git push origin my-feature-branch
   ```
7. **Open a PR**: Submit a pull request to the `main` branch of the Gland repository.

**PR Guidelines**:

- Provide a clear description of the changes.
- Reference related issues (e.g., `Fixes #123`).
- Ensure your code follows the project’s style and conventions.

---

## <a name="development-setup"></a> Development Setup

### Running the Project

1. Build the project:
   ```bash
   npm run build
   ```
2. Run tests:
   ```bash
   npm test
   ```

### Common Scripts

- **Build**: `npm run build`
- **Test**: `npm test`

---

## <a name="coding-guidelines"></a> Coding Guidelines

To maintain consistency across the codebase, please follow these rules:

1. **TypeScript**: Use TypeScript for all new code.
2. **Event-Driven Design**: Ensure all features align with Gland’s event-driven architecture.
3. **Modularity**: Keep code modular and reusable.
4. **Testing**: Write unit tests for new features and bug fixes.
5. **Documentation**: Add comments and update documentation as needed.

---

## <a name="commit-message-format"></a> Commit Message Format

We follow a structured commit message format to maintain a clean project history. Each commit message should include:

- **Type**: The type of change (e.g., `feat`, `fix`, `docs`).
- **Scope**: The affected module or package (e.g., `core`, `channel`).
- **Subject**: A concise description of the change.

Example:

```
feat(core): add support for event-scoped middleware
```

### Allowed Types

- **feat**: A new feature.
- **fix**: A bug fix.
- **docs**: Documentation changes.
- **style**: Code formatting or style changes.
- **refactor**: Code refactoring (no functional changes).
- **test**: Adding or updating tests.
- **chore**: Maintenance tasks (e.g., dependency updates).

---

## Thank You!

Your contributions make Gland better for everyone. Whether you’re fixing a bug, adding a feature, or improving documentation, we appreciate your effort and dedication.

If you have any questions, feel free to reach out by opening an issue or joining our community discussions.
