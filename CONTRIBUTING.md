# Contributing

Thank you for your interest in contributing to `@cosrx/core`. Contributions of all kinds are welcome bug fixes, improvements, documentation, and discussions.

By participating in this project, you agree to maintain a respectful and constructive environment.

---

## Code Style

- Use modern TypeScript
- Prefer explicit, readable code over clever abstractions
- Avoid unnecessary dependencies Cosrx is intentionally lightweight
- Follow existing patterns in the codebase
- Keep public APIs stable and backward-compatible whenever possible

If you're unsure about style or structure, open an issue before starting large changes.

---

## Commit Messages

Please follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add request deduplication support
fix: handle abort signal race condition
docs: update README cookie section
refactor: simplify retry backoff logic
```

This helps with changelogs and future automation.

---

## Testing

- All changes should be covered by tests where applicable
- Existing tests must continue to pass
- Pull requests with failing CI checks will not be merged

Before opening a PR, run:

```bash
npm test
```

---

## Documentation

Cosrx documentation lives primarily in the README. If your change affects any of the following, the README must be updated accordingly:

- Request configuration
- Interceptors
- Retry behavior
- Cancellation
- Cookies or authentication
- Error handling

The documentation should always reflect actual runtime behavior no assumptions, no magic.

---

## Developing Locally

1. Fork the repository
2. Clone your fork
3. Install dependencies:
   ```bash
   npm install
   ```
4. Build the library:
   ```bash
   npm run build
   ```
5. Run tests:
   ```bash
   npm test
   ```

---

## Pull Request Guidelines

- Keep PRs focused and small
- One logical change per PR is preferred
- Clearly describe what changed and why
- Link related issues if applicable

If your PR introduces a breaking change, call it out explicitly.

---

## Design Principles

When contributing, keep Cosrx's core philosophy in mind:

- Built on native Fetch APIs
- No hidden behavior or implicit magic
- Explicit configuration over opinionated defaults
- Browser and server behavior should match platform standards
- Auth, cookies, and retries must remain opt-in and predictable

If a change violates these principles, it's unlikely to be accepted.

---

## Questions & Discussion

If you're unsure about an idea or approach, open an issue or start a discussion before implementing large or invasive changes. Thoughtful discussion is always preferred over wasted effort.

---

## License

By contributing to `@cosrx/core`, you agree that your contributions will be licensed under the MIT License.

---

You don't need to be perfect to contribute. Clear intent, clean code, and honest communication matter more.
