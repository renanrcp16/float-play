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
9. Build once more from the exact commit intended for upload:

```bash
pnpm build
```

10. Inspect `dist/` and confirm `manifest.json` is directly inside `dist/`, not nested under another directory.

## Create the Chrome Web Store ZIP

The Chrome Web Store upload ZIP must contain the extension files with `manifest.json` at the ZIP root.

### Windows PowerShell

From the repository root, after `pnpm build`:

```powershell
$version = (Get-Content public/manifest.json | ConvertFrom-Json).version
$zip = "floatplay-$version.zip"
Remove-Item $zip -ErrorAction SilentlyContinue
Compress-Archive -Path dist\* -DestinationPath $zip
```

### macOS / Linux

From the repository root, after `pnpm build`:

```bash
version=$(node -p "JSON.parse(require('fs').readFileSync('public/manifest.json','utf8')).version")
rm -f "floatplay-$version.zip"
(cd dist && zip -r "../floatplay-$version.zip" .)
```

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
- required real Chrome/YouTube smoke tests pass.
- permission and privacy disclosures match the shipped manifest and runtime behavior.
- listing copy matches implemented functionality.
- required store images and public URLs are ready.
- the privacy policy is publicly accessible at the URL supplied to the Chrome Web Store.
- the release version is synchronized between package and manifest metadata.
