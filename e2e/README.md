# FloatPlay browser E2E tests

This directory contains deterministic browser-level tests for extension-owned FloatPlay surfaces. It intentionally does not automate the live YouTube or Document Picture-in-Picture lifecycle; those scenarios remain covered by the real Chrome/YouTube smoke matrix in `docs/TESTING.md`.

## One-time setup

From the repository root, install the isolated E2E package and its Chromium build:

```bash
pnpm e2e:install
```

The E2E dependencies use their own `e2e/pnpm-lock.yaml`, so they do not become runtime or root development dependencies of the extension.

## Run

From the repository root:

```bash
pnpm test:e2e
```

The command builds the production extension into `dist/`, launches Playwright's bundled Chromium with that unpacked extension loaded in a fresh persistent context, and runs the browser tests.

The initial suite verifies that:

- the real Manifest V3 extension loads successfully;
- the real Options Page initializes without page or console errors;
- current default settings are rendered;
- supported settings persist through `chrome.storage.sync` when the Options Page is reopened;
- `Restore defaults` persists the approved defaults again.

## Validation boundary

`pnpm validate` intentionally remains browser-independent and continues to run lint, typecheck, unit tests, and the production build only. Run `pnpm test:e2e` in addition to `pnpm validate` when changing extension-owned browser flows covered by this suite.
