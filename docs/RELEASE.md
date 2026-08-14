# FloatPlay Release Readiness

This document is the canonical checklist for preparing a FloatPlay release candidate and Chrome Web Store upload package. It does not authorize publication by itself.

## Release status

FloatPlay remains below `1.0.0` until every item in the v1 Definition of Done in `docs/PRD.md` is satisfied.

The version in `package.json` and `public/manifest.json` must remain intentionally synchronized for every release candidate.

## Release candidate checklist

1. Start from an up-to-date `main` branch with a clean working tree.
2. Confirm the intended version in both `package.json` and `public/manifest.json`.
3. Install dependencies from the committed lockfiles.
4. Run the deterministic project gate:

```bash
pnpm validate
```

5. Run the browser-level extension-owned E2E suite:

```bash
pnpm test:e2e
```

6. Run the relevant real Chrome/YouTube smoke-test matrix from `docs/TESTING.md`. Record Chrome version, operating system, tested commit, other YouTube-modifying extensions, FloatPlay console errors, and results.
7. Review the production manifest and confirm no new permissions, host access, remote code, analytics, telemetry, or backend dependencies were introduced unintentionally.
8. Review `docs/WEB_STORE.md` and `docs/PRIVACY.md` against the current implementation and current Chrome Web Store policy before submission.
9. From the exact commit intended for upload, create the release package:

```bash
pnpm package:release
```

This command runs `pnpm verify:release`, which rebuilds `dist/`, verifies version synchronization, checks the approved v1 permission and YouTube content-script scope, and confirms that manifest-referenced extension files and required locales exist. It then creates a deterministic `floatplay-<version>.zip` archive from the verified `dist/` contents.

10. Inspect the generated ZIP before upload.

## Create the Chrome Web Store ZIP

Use the cross-platform release packaging command from the repository root:

```bash
pnpm package:release
```

The generated archive is named from the manifest version, for example `floatplay-0.1.0.zip`. Re-running the command replaces the archive for that version.

The packager:

- includes only regular files from `dist/`;
- places `manifest.json` directly at the archive root rather than nesting `dist/`;
- writes entries in deterministic path order with fixed ZIP timestamps;
- verifies the generated central directory and entry names before writing the archive;
- adds no runtime dependency and does not change extension behavior.

Generated `floatplay-*.zip` files are ignored by Git and must not be committed.

## Package inspection

Before upload, inspect the ZIP and confirm at minimum:

- `manifest.json` is at the archive root.
- `options.html`, `options.js`, `options.css`, and `service-worker.js` are present.
- content-script bundles are present.
- `_locales/en/messages.json` and `_locales/pt_BR/messages.json` are present.
- the required extension icons are present.
- no repository-only files such as tests, source TypeScript, `.git`, or `node_modules` are included.

## Permission and privacy review

The release candidate should continue to request only the access required by implemented v1 behavior.

Current expected access is documented in `docs/WEB_STORE.md`. Any new permission, host scope, data handling, analytics, telemetry, remote code, or backend dependency requires a fresh product/security review before release.

## Final release gate

Do not upload a release candidate until all of the following are true:

- `pnpm validate` passes.
- `pnpm test:e2e` passes.
- `pnpm package:release` completes successfully, including the embedded release verification.
- required real Chrome/YouTube smoke tests pass.
- permission and privacy disclosures match the shipped manifest and runtime behavior.
- listing copy matches implemented functionality.
- required store images and public URLs are ready.
- the privacy policy is publicly accessible at the URL supplied to the Chrome Web Store.
- the release version is synchronized between package and manifest metadata.
