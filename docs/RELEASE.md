# FloatPlay Release Readiness

This document is the canonical checklist for preparing a FloatPlay release candidate and Chrome Web Store upload package. It does not authorize publication by itself.

## Release status

FloatPlay remains below `1.0.0` until every item in the v1 Definition of Done in `docs/PRD.md` is satisfied.

The version in `package.json` and `public/manifest.json` must remain intentionally synchronized for every release candidate.

## Release security contract

The v1 release manifest is intentionally allowlisted. `pnpm verify:release` must fail when a security-sensitive manifest capability changes without a corresponding engineering/security review.

The approved v1 contract currently requires:

- Manifest V3;
- minimum Chrome version 116;
- the single explicit permission `storage`;
- no `host_permissions`, `optional_permissions`, `optional_host_permissions`, `externally_connectable`, or sandbox pages;
- exactly two YouTube content scripts on the approved `youtube.com` origins, with the approved script files, execution worlds, and `run_at` values;
- the service worker `service-worker.js`;
- the full-page Options Page `options.html`;
- exactly one web-accessible resource group exposing only `brand/icon.svg` to the approved YouTube origins;
- an explicit extension-page Content Security Policy of `default-src 'self'`;
- the approved extension icon set and locale metadata.

The verifier also requires `dist/manifest.json` to match the source manifest exactly. Adding a new manifest key, permission, host scope, execution world, content script, web-accessible resource, or other capability therefore requires an intentional update to both the manifest and release contract.

Production build output and the Chrome Web Store ZIP must not contain source maps. The Vite production entries disable source-map generation, `verify:release` rejects `.map` files in `dist/`, and the ZIP packager independently rejects `.map` entries.

## CI and dependency security

Pull requests targeting `main` and pushes to `main` are checked by `.github/workflows/ci.yml`.

The workflow provides three independent signals:

- `Validate` runs the canonical project gate and release-manifest verifier using the committed root lockfile.
- `Dependency audit` audits both the root and isolated `e2e/` dependency trees for known high or critical vulnerabilities.
- `Browser E2E` installs Playwright Chromium on the GitHub runner and executes the deterministic extension-owned E2E suite using both committed lockfiles.

CI uses `--frozen-lockfile` and must never rewrite dependency resolution as part of validation.

`.github/dependabot.yml` monitors dependency version updates for the root package, `e2e/`, and GitHub Actions. Repository administrators must also keep the GitHub dependency graph, Dependabot alerts, and Dependabot security updates enabled under repository Advanced Security settings. These repository-level settings are part of the release security posture even though they are not stored in the Git tree.

Immediately before a release candidate is packaged, run the explicit dependency audit locally as well:

```bash
pnpm audit:dependencies
```

A high or critical advisory must be resolved or explicitly reviewed before release. Do not suppress an advisory merely to make the gate pass.

## Release candidate checklist

1. Start from an up-to-date `main` branch with a clean working tree.
2. Confirm the intended version in both `package.json` and `public/manifest.json`.
3. Install dependencies from the committed lockfiles.
4. Confirm the latest CI run for the exact candidate commit is green for Validate, Dependency audit, and Browser E2E.
5. Run the deterministic project gate locally:

```bash
pnpm validate
```

6. Run the dependency security audit:

```bash
pnpm audit:dependencies
```

7. Run the browser-level extension-owned E2E suite:

```bash
pnpm test:e2e
```

8. Run the relevant real Chrome/YouTube smoke-test matrix from `docs/TESTING.md`. Record Chrome version, operating system, tested commit, other YouTube-modifying extensions, FloatPlay console errors, and results.
9. Review the production manifest and confirm the release security contract above still represents the intended product. Any new capability requires review before the verifier allowlist is changed.
10. Confirm the dependency graph, Dependabot alerts, and Dependabot security updates remain enabled for the repository and review any open security alerts.
11. Review `docs/WEB_STORE.md` and `docs/PRIVACY.md` against the current implementation and current Chrome Web Store policy before submission.
12. From the exact commit intended for upload, create the release package:

```bash
pnpm package:release
```

This command first runs `pnpm verify:release`, which rebuilds `dist/`, verifies package/manifest version synchronization, asserts the complete approved v1 manifest security allowlist, confirms source and built manifests match, rejects production source maps, and confirms that manifest-referenced extension files and required locales exist. It then creates a deterministic `floatplay-<version>.zip` archive from the verified `dist/` contents.

13. Inspect the generated ZIP before upload.

## Create the Chrome Web Store ZIP

Use the cross-platform release packaging command from the repository root:

```bash
pnpm package:release
```

The generated archive is named from the manifest version, for example `floatplay-0.1.0.zip`. Re-running the command replaces the archive for that version.

The packager:

- includes only regular files from the verified `dist/` tree;
- rejects source-map entries even if the packager is invoked independently;
- places `manifest.json` directly at the archive root rather than nesting `dist/`;
- writes entries in deterministic path order with fixed ZIP timestamps;
- verifies the generated central directory and entry names before writing the archive;
- asserts that the ZIP entry list matches `dist/` exactly;
- adds no runtime dependency and does not change extension behavior.

Generated `floatplay-*.zip` files are ignored by Git and must not be committed.

## Package inspection

Before upload, inspect the ZIP and confirm at minimum:

- `manifest.json` is at the archive root;
- `options.html`, `options.js`, `options.css`, and `service-worker.js` are present;
- `content.js` and `youtube-player-main.js` are present;
- `_locales/en/messages.json` and `_locales/pt_BR/messages.json` are present;
- the required extension icons and `brand/icon.svg` are present;
- no `.map` files are present;
- no repository-only files such as tests, source TypeScript, `.git`, or `node_modules` are included.

## Permission and privacy review

The release candidate should continue to request only the access required by implemented v1 behavior.

Current expected access is documented in `docs/WEB_STORE.md`. Any new permission, host scope, data handling, analytics, telemetry, remote code, backend dependency, externally connectable surface, sandbox, or additional web-accessible resource requires a fresh product/security review before release.

The explicit extension-page CSP is part of this review. It must remain compatible with packaged local resources and must not be relaxed to permit remote executable code.

## Final release gate

Do not upload a release candidate until all of the following are true:

- CI is green for the exact candidate commit;
- `pnpm validate` passes;
- `pnpm audit:dependencies` reports no unresolved high or critical advisory;
- `pnpm test:e2e` passes;
- `pnpm package:release` completes successfully, including the embedded manifest/security verification;
- required real Chrome/YouTube smoke tests pass;
- the generated ZIP has been inspected and contains no source maps or unexpected files;
- dependency graph, Dependabot alerts, and Dependabot security updates are enabled and current repository security alerts have been reviewed;
- permission and privacy disclosures match the shipped manifest and runtime behavior;
- the explicit CSP and Manifest allowlist match the reviewed v1 architecture;
- listing copy matches implemented functionality;
- required store images and public URLs are ready;
- the privacy policy is publicly accessible at the URL supplied to the Chrome Web Store;
- the release version is synchronized between package and manifest metadata.
