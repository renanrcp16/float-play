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

The suite verifies that:

- the real Manifest V3 extension loads successfully;
- the real Options Page initializes without page or console errors;
- current default settings are rendered;
- supported settings persist through `chrome.storage.sync` when the Options Page is reopened;
- `Restore defaults` persists the approved defaults again;
- the built `content.js` inserts the real icon-only FloatPlay trigger on a deterministic synthetic `/watch` page with the minimal supported DOM/media conditions;
- first-use coachmark state is read from and persisted to the real extension `chrome.storage.local` area;
- explicit coachmark dismissal remains persisted after a page reload;
- navigation-like replacement/removal/recreation of the preferred trigger anchor reconciles the existing trigger without duplication;
- fallback placement is used when the preferred anchor is absent and the same trigger returns inline when the anchor becomes available again.

The trigger tests do not mock `FloatPlayController`, `FloatPlayTrigger`, or Chrome storage. They load the built extension and inspect the closed trigger Shadow DOM through Chromium's DevTools Protocol so production encapsulation does not need a test-only escape hatch.

The synthetic page deliberately supplies only the stable conditions FloatPlay owns or explicitly expects: a YouTube `/watch` URL, a minimal preferred-anchor shape, and a visible native `<video>` element. It is not evidence that the current live YouTube DOM still matches those conditions. Real YouTube placement, SPA behavior, Document Picture-in-Picture, playlists, live streams, advertising transitions, and browser-owned lifecycle behavior remain mandatory manual smoke-test territory.

## Chrome Web Store screenshot candidate

A real Options Page screenshot can be captured from the built extension with:

```bash
pnpm capture:store-screenshot
```

The command launches the same Playwright Chromium harness with a deterministic 1280x800 viewport, English locale, light color scheme, and 1x device scale. It opens the actual built `options.html`, verifies that the page renders without page or console errors, and writes:

```text
artifacts/web-store/options-page-en-1280x800.png
```

The generated `artifacts/` directory is ignored by Git so the screenshot can be reviewed before it is selected for a store listing. This command does not create or simulate a YouTube/PiP screenshot; a real PiP capture remains a separate manual store asset.

## Validation boundary

`pnpm validate` intentionally remains browser-independent and continues to run lint, typecheck, unit tests, and the production build only. Run `pnpm test:e2e` in addition to `pnpm validate` when changing extension-owned browser flows covered by this suite.

A passing deterministic E2E suite is necessary but not sufficient for release. The exact release candidate must still pass the real Chrome/YouTube smoke matrix documented in `docs/TESTING.md`.
