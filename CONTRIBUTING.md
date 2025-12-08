# Contributing to @gdenier/pocketbase-db-collection

Thank you for your interest in contributing!

## Development Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/pocketbase-db-collection.git
cd pocketbase-db-collection
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Development Workflow

### Building

```bash
npm run build        # Build the library
npm run dev          # Build in watch mode
```

### Linting

```bash
npm run lint         # Run ESLint
```

### Testing

```bash
npm test             # Run tests
npm run test:coverage # Run tests with coverage
```

## Project Structure

```
pocketbase-db-collection/
├── src/
│   ├── index.ts          # Barrel exports
│   ├── pocketbase.ts     # Main implementation
│   └── errors.ts         # Error classes
├── examples/             # Usage examples
├── dist/                 # Build output (generated)
└── tests/               # Test files
```

## Making Changes

1. Create a new branch for your feature or bugfix
2. Make your changes
3. Ensure the build succeeds: `npm run build`
4. Ensure linting passes: `npm run lint`
5. Update documentation if needed
6. Submit a pull request

## Code Style

- Use TypeScript for all source files
- Follow the existing code style
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

## Commit Messages

Follow conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

## Publishing (Maintainers Only)

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Build the project: `npm run build`
4. Publish to npm: `npm publish --access public`
5. Create a git tag: `git tag v0.x.x && git push --tags`

## Questions?

Feel free to open an issue for any questions or concerns.
