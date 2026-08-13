# FloatPlay

FloatPlay is a Chrome extension that enhances YouTube Picture-in-Picture with better playback controls, a minimal interface, and a robust, privacy-first architecture.

## Status

FloatPlay is currently in early development. The first milestone validates the core Document Picture-in-Picture integration before the production player UI is implemented.

## Documentation

- [Product requirements](docs/PRD.md)
- [Architecture](docs/ARCHITECTURE.md)

## Development

### Requirements

- Node.js 22.12 or newer
- pnpm 11
- Google Chrome desktop

### Commands

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm validate
```

`pnpm build` writes the unpacked extension to `dist/`.

### Load the extension locally

1. Build the project with `pnpm build`.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode**.
4. Choose **Load unpacked**.
5. Select the generated `dist/` directory.
6. Open a supported YouTube watch page.

## Project conventions

- Source code and repository-facing technical content are written in English.
- TypeScript runs in strict mode.
- Dependencies must have a clear technical purpose.
- YouTube-specific DOM knowledge stays isolated from the application core.
- Changes are developed through short-lived branches and pull requests.
- Conventional Commits are used for commit messages.
