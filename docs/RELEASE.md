# FloatPlay Release Readiness

This document is the canonical checklist for preparing a FloatPlay release candidate and Chrome Web Store upload package. It does not authorize publication by itself.

## Release status

FloatPlay uses `1.0.0` metadata for the final v1 release candidate so that the exact artifact intended for publication can be validated end to end. Setting `1.0.0` in repository metadata does **not** mean the release is approved or publicly released.

The version in `package.json` and `public/manifest.json` must remain intentionally synchronized. Once the final `1.0.0` candidate is merged to `main`, any subsequent code, configuration, manifest, release-documentation, or packaged-asset change creates a new candidate and invalidates exact-candidate validation that was recorded against an older SHA.

Chrome Web Store publication is authorized only after the exact merged `1.0.0` candidate satisfies the final release gate below.

## Release security contract

The v1 release manifest is intentionally allowlisted. `pnpm verify:release` must fail when a security-sensitive manifest capability changes without a corresponding engineering/security review.

The approved v1 contract requires:

- Manifest V3;
- minimum Chrome version 130 so the supported baseline includes the reviewed Document Picture-in-Picture option set used by FloatPlay;
- the single explicit permission `storage`;
- no `host_permissions`, `optional_permissions`, `optional_host_permissions`, or sandbox pages;
- an explicit `externally_connectable` policy with an empty extension-ID allowlist and no web-page match patterns;
- exactly two YouTube content scripts on the approved `youtube.com` origins, with the approved script files, execution worlds, and `run_at` values;
- the service worker `service-worker.js`;
- the full-page Options Page `options.html`;
- exactly one web-accessible resource group exposing only `brand/icon.svg` to the approved YouTube origins;
- an explicit extension-page Content Security Policy of `default-src 'self'`;
- the approved extension icon set and locale metadata;
- no remote executable code or runtime-loaded external script dependency;
- no production source maps in `dist/` or the Chrome Web Store ZIP.

The release verifier requires `dist/manifest.json` to match the source manifest exactly. Adding a new manifest key, permission, host scope, external connection allowance, execution world, content script, web-accessible resource, or other capability therefore requires an intentional update to the manifest, verifier, documentation, and security/privacy review.

## Settings safety contract

The v1 Options Page and persisted settings enforce these supported numeric ranges:

- backward seek: 0.1 through 600 seconds;
- forward seek: 0.1 through 600 seconds;
- volume adjustment step: 1% through 100%;
- auto-hide delay: 0 through 60 seconds.

The approved defaults remain 5 seconds backward, 5 seconds forward, 5% volume adjustment, automatic control hiding enabled, and a 1-second auto-hide delay. Persisted or form values outside the supported ranges must be rejected or normalized to safe defaults rather than reaching playback/timer code unchecked.

## CI and dependency security

Pull requests targeting `main` and pushes to `main` are checked by `.github/workflows/ci.yml`.

The workflow provides three independent release signals:

- `Validate` runs lint, TypeScript type checking, automated tests, the production build, and release-boundary verification.
- `Dependency audit` audits both the root and isolated `e2e/` dependency trees for known high or critical vulnerabilities.
- `Browser E2E` installs Playwright Chromium and executes the deterministic extension-owned E2E suite using committed lockfiles.

The Browser E2E suite covers the real Options Page and deterministic trigger/onboarding behavior using the built extension. It is intentionally not a substitute for current live YouTube compatibility or real Document Picture-in-Picture lifecycle validation.

CI uses `--frozen-lockfile` and must never rewrite dependency resolution as part of validation. GitHub Actions used by the workflow must remain pinned to reviewed commit SHAs, and the workflow token must remain least-privileged for validation work.

`.github/dependabot.yml` monitors GitHub Actions. Package-version automation must not be expanded beyond package-manager support that GitHub currently documents for the repository's pnpm version without explicit review. Repository administrators must keep the dependency graph, Dependabot alerts, supported Dependabot security updates, secret scanning/push protection where available, CodeQL/code scanning, and GitHub Private Vulnerability Reporting enabled and reviewed as part of the release posture.

## Repository governance

`main` must require pull-request-based changes and prevent deletion/non-fast-forward changes through repository rules. Before public v1 publication, the active `Protect main` ruleset must also require the stable CI checks:

- `Validate`;
- `Dependency audit`;
- `Browser E2E`.

Where the ruleset supports it without making the single-maintainer workflow impractical, require the pull-request branch to be up to date before merge. Do not add a bypass actor solely to make release integration easier.

`.github/SECURITY.md` is the canonical public vulnerability-reporting policy and GitHub Private Vulnerability Reporting must remain enabled.

## Final v1 release-candidate workflow

1. Start from an up-to-date protected `main` with a clean working tree and no unresolved pre-v1 engineering change planned.
2. Create the release-candidate branch and set the intended release version in both `package.json` and `public/manifest.json`. For v1, both values are `1.0.0`.
3. Synchronize release-facing documentation in the same candidate change. Do not leave known behavior, privacy, manifest, testing, or Chrome Web Store documentation stale merely to avoid changing the SHA.
4. Open a pull request and require `Validate`, `Dependency audit`, and `Browser E2E` to pass on the release-candidate head.
5. Merge by the repository-approved method. The merged `main` SHA becomes the exact candidate intended for publication.
6. Confirm `Validate`, `Dependency audit`, and `Browser E2E` are green on that exact merged `main` SHA.
7. From that exact SHA, install dependencies from the committed lockfiles and run:

```bash
pnpm validate
pnpm audit:dependencies
pnpm test:e2e
```

8. Run the complete applicable real Chrome/YouTube smoke matrix from `docs/TESTING.md` and issue #53 against that exact SHA. Record at minimum the Chrome version, operating system, tested commit, other YouTube-modifying extensions, and any FloatPlay console/runtime errors.
9. The final real smoke must include a natural YouTube advertising transition when available. FloatPlay must neither block nor automatically skip the ad, and the supported player experience must remain structurally sound when normal content resumes.
10. Recheck Options Page validation at the supported numeric boundaries and confirm defaults remain 5s / 5s / 5% / 1s.
11. Review `docs/WEB_STORE.md`, `docs/PRIVACY.md`, `.github/SECURITY.md`, the production manifest, and repository security settings against the exact candidate.
12. From that same exact SHA, create the release package:

```bash
pnpm package:release
```

13. Inspect the generated `floatplay-1.0.0.zip` before upload.
14. Record the exact candidate SHA and, preferably, a SHA-256 digest of the final ZIP used for the Chrome Web Store upload.

If any source, documentation, manifest, release asset, or package-relevant change is required after step 5, stop and treat the new merged SHA as a new candidate. Repeat the exact-candidate gates rather than carrying forward a final-smoke result from an older SHA.

## Release package contract

`pnpm package:release` first runs `pnpm verify:release`, which rebuilds `dist/`, verifies package/manifest version synchronization, asserts the approved v1 manifest security allowlist, confirms source and built manifests match, rejects production source maps, verifies packaged PNG icon decodability, and confirms manifest-referenced extension files and required locales exist.

The packager then creates a deterministic `floatplay-<version>.zip` from the verified `dist/` tree. It:

- includes only regular files from verified `dist/`;
- rejects `.map` entries;
- places `manifest.json` directly at the archive root;
- rejects unsafe archive paths;
- writes entries in deterministic path order with fixed ZIP timestamps;
- verifies that the archive entry list matches `dist/` exactly;
- adds no runtime dependency.

Generated `floatplay-*.zip` files are ignored by Git and must not be committed.

## Package inspection

Before upload, confirm at minimum that:

- `manifest.json` is at the archive root and reports version `1.0.0`;
- `options.html`, `options.js`, `options.css`, and `service-worker.js` are present;
- `content.js` and `youtube-player-main.js` are present;
- `_locales/en/messages.json` and `_locales/pt_BR/messages.json` are present;
- required extension icons and `brand/icon.svg` are present and valid;
- no `.map` files are present;
- no repository-only files such as tests, source TypeScript, `.git`, `.env`, private-key files, or `node_modules` are included.

## Permission, privacy, and store review

The release candidate must continue to request only access required by implemented v1 behavior. Current expected access and reviewer-facing justification are documented in `docs/WEB_STORE.md`.

Any new permission, host scope, data handling, analytics, telemetry, remote code, backend dependency, external connection allowance, sandbox, or additional web-accessible resource requires a fresh product/security/privacy review before release.

The Chrome Web Store listing and privacy disclosures must accurately describe local processing of current supported YouTube page/media state, Chrome storage sync, the local onboarding flag, and the same-tab playback synchronization bridge. FloatPlay must not claim that it handles no browsing/site data merely because it has no backend; the precise statement is that it does not retain, build, or transmit its own YouTube watch-history database.

The public privacy-policy and support URLs supplied to the Chrome Web Store must be reachable by the store before submission. Public GitHub Issues must not instruct users to disclose personal, sensitive, account, authentication, payment, or other private information.

## Final release gate

Do not submit or publish the v1 package until all of the following are true:

- `package.json` and `public/manifest.json` both report `1.0.0`;
- CI is green for `Validate`, `Dependency audit`, and `Browser E2E` on the exact merged candidate SHA;
- the same three stable CI checks are required by the active `Protect main` ruleset;
- local `pnpm validate` passes on the exact candidate;
- local `pnpm audit:dependencies` reports no unresolved high or critical advisory;
- local `pnpm test:e2e` passes on the exact candidate;
- the real Chrome/YouTube smoke matrix, including advertising behavior, passes on the exact candidate;
- no release-blocking FloatPlay console/runtime errors are observed;
- `pnpm package:release` completes successfully on the exact candidate;
- `floatplay-1.0.0.zip` is inspected and contains no unexpected files or source maps;
- `main` remains protected against direct/force-push changes and required checks are active;
- GitHub Private Vulnerability Reporting and the intended repository security settings remain enabled/reviewed;
- permission, privacy, and Chrome Web Store disclosures match shipped behavior;
- listing copy and screenshots match the submitted version;
- required store graphics are ready;
- the privacy-policy URL and support URL are publicly reachable;
- issue #53 records and passes the exact final candidate rather than an older smoke target.
