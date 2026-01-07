# Contributing to Janus

Thank you for your interest in contributing to Janus! We welcome contributions from the community.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Enhancements](#suggesting-enhancements)

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please read [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) before contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/JCDubs/Janus.git`
3. Add upstream remote: `git remote add upstream https://github.com/JCDubs/Janus.git`
4. Create a new branch: `git checkout -b feature/your-feature-name`

## How to Contribute

### Types of Contributions

We welcome many types of contributions:

- 🐛 **Bug fixes**
- ✨ **New features**
- 📝 **Documentation improvements**
- 🧪 **Test coverage**
- 🎨 **Code refactoring**
- 🌐 **Translations**
- 💡 **Examples and tutorials**

### First Time Contributors

Look for issues tagged with:
- `good first issue` - Great for newcomers
- `help wanted` - We need your expertise

## Development Setup

### Prerequisites

- Node.js 18 or higher
- pnpm 10 or higher

### Installation

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

### Project Structure

```
Janus/
├── src/
│   ├── authorization-middleware/  # Middy middleware
│   ├── authorization-service/     # Core authorization logic
│   ├── auth-lambda/               # Lambda utilities
│   ├── errors/                    # Custom error classes
│   ├── file-loader/               # File loading utilities
│   └── user-details/              # User extraction utilities
├── coverage/                      # Test coverage reports
└── dist/                          # Compiled output
```

## Coding Standards

### TypeScript

- Use TypeScript for all code
- Follow existing code style
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### Code Style

We use Biome for code formatting and linting:

```bash
# Format code (when linting is configured)
pnpm lint
```

### Naming Conventions

- **Classes**: PascalCase (e.g., `AuthorizationService`)
- **Functions/Methods**: camelCase (e.g., `isAuthorized`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `POLICY_FILE_NAME`)
- **Interfaces/Types**: PascalCase with descriptive names (e.g., `AuthorizationConfigType`)

### Documentation

- Add JSDoc comments for all public APIs
- Include `@param`, `@returns`, `@throws`, and `@example` tags
- Update README.md if adding new features
- Add inline comments for complex logic

## Testing

### Writing Tests

- Place tests next to the code they test (e.g., `service.ts` → `service.test.ts`)
- Use descriptive test names that explain the scenario
- Follow the Arrange-Act-Assert pattern
- Mock external dependencies

### Test Coverage

- Aim for >80% code coverage
- All new features must include tests
- Bug fixes should include regression tests

Example test structure:

```typescript
describe('AuthorizationService', () => {
  describe('isAuthorized', () => {
    it('should return true when user has permission', () => {
      // Arrange
      const service = new AuthorizationService(/* ... */);
      
      // Act
      const result = service.isAuthorized();
      
      // Assert
      expect(result).toBe(true);
    });
  });
});
```

## Submitting Changes

### Pull Request Process

1. **Update your fork**
   ```bash
   git fetch upstream
   git rebase upstream/master
   ```

2. **Make your changes**
   - Write clean, well-documented code
   - Add tests for new functionality
   - Update documentation as needed

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new authorization feature"
   ```

   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `test:` - Test updates
   - `refactor:` - Code refactoring
   - `chore:` - Build/tooling changes

4. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your fork and branch
   - Fill out the PR template
   - Link any related issues

### Pull Request Guidelines

- ✅ Keep PRs focused and atomic
- ✅ Include tests
- ✅ Update documentation
- ✅ Pass all CI checks
- ✅ Respond to review feedback
- ❌ Don't include unrelated changes
- ❌ Don't submit work in progress (use draft PRs instead)

## Reporting Bugs

### Before Submitting

- Check existing issues to avoid duplicates
- Verify the bug in the latest version
- Collect relevant information

### Bug Report Template

```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Initialize service with '...'
2. Call method '...'
3. See error

**Expected behavior**
What you expected to happen.

**Actual behavior**
What actually happened.

**Environment:**
- Node version: [e.g., 18.0.0]
- Package version: [e.g., 1.0.0]
- OS: [e.g., macOS 12.0]

**Additional context**
Add any other context, logs, or screenshots.
```

## Suggesting Enhancements

### Enhancement Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Alternative solutions or features you've considered.

**Additional context**
Any other context, mockups, or examples.
```

## Review Process

1. Maintainers will review your PR
2. Address any requested changes
3. Once approved, a maintainer will merge your PR
4. Your contribution will be included in the next release

## Getting Help

- 💬 [GitHub Discussions](https://github.com/JCDubs/Janus/discussions)
- 🐛 [Issue Tracker](https://github.com/JCDubs/Janus/issues)

## Recognition

Contributors will be recognized in:
- Release notes
- README acknowledgments
- GitHub contributors page

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Janus! 🎉
