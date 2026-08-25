# FloatPlay Release Readiness

This document is the canonical checklist for preparing a FloatPlay release candidate and Chrome Web Store upload package. It does not authorize publication by itself.

## Current release status

- Public stable: `v1.1.1`
- Current release target: none
- Last release type: focused patch hotfix
- Released candidate SHA: `e3da74ff968ed79709a99a09ef53cb0206daaed0`
- Release issue: #131

The version in `package.json` and `public/manifest.json` must remain synchronized. Any source, manifest, release-facing documentation, or package-relevant change after a candidate is validated creates a new candidate SHA and invalidates validation recorded against the older SHA.

Do not move or recreate existing release tags. The `v1.1.1` tag must point to the exact released candidate SHA `e3da74ff968ed79709a99a09ef53cb0206daaed0`, regardless of later documentation or development commits on `main`.

## v1.1.1 publication record

- Chrome Web Store publication confirmed on 2026-08-25.
- Exact released candidate SHA: `e3da74ff968ed79709a99a09ef53cb0206daaed0`.
- Release ZIP: `floatplay-1.1.1.zip` (`16` files, `134383` bytes).
- Release ZIP SHA-256: `AE6C13B2B9C438C95050C310FB345250C31A872A3936EFC83AC1D1D624D302FB`.
- Targeted live Chrome validation for the shipped behavior passed before release preparation.

## v1.1.1 scope

`v1.1.1` is a patch release containing the focused fix merged in #130:

- remove unreliable PiP video hover dimming that could remain visually stale when the pointer left the Document Picture-in-Picture window;
- preserve the optional click-on-video Play/Pause behavior;
- preserve the pointer cursor as the clickability affordance when that preference is enabled;
- make no change to permissions, host access, persisted settings, YouTube/YouTube Music integration scope, MAIN-world responsibilities, data handling, privacy behavior, or runtime dependencies.

No unrelated feature work belongs in this release candidate.

## Release security contract

The production manifest remains intentionally allowlisted. `pnpm verify:release` must fail when a security-sensitive capability changes without intentional engineering/security review.

The approved v1.1.1 contract remains the same as v1.1.0:

- Manifest V3;
- minimum Chrome version 130;
- the single explicit permission `storage`;
- no `host_permissions`, optional permissions, optional host permissions, or sandbox pages;
- content scripts limited to `https://www.youtube.com/*`, `https://youtube.com/*`, and `https://music.youtube.com/*`;
- exactly one isolated FloatPlay content script and one narrow MAIN-world YouTube player bridge on those origins;
- service worker `service-worker.js`;
- Options Page `options.html`;
- exactly one web-accessible resource group exposing only `brand/icon.svg` to the approved YouTube origins;
- extension-page CSP `default-src 'self'`;
- external messaging closed with an empty `externally_connectable.ids` allowlist and no web-page match patterns;
- no remote executable code, backend, analytics, telemetry, authentication, advertising SDK, or runtime-loaded external script dependency;
- no production source maps in `dist/` or the Chrome Web Store ZIP.

The MAIN-world bridge remains same-window/same-origin and accepts only the reviewed playback synchronization actions: volume, mute, playback rate, YouTube Music current-track seek, and YouTube Music previous/next track navigation.

Any new manifest key, permission, host, external connection allowance, execution world, content script, web-accessible resource, remote code path, backend dependency, or expanded data handling requires a fresh architecture/security/privacy review before release.

## Required CI

Pull requests targeting `main` must pass:

- `Validate`
- `Dependency audit`
- `Browser E2E`

`Validate` includes lint, TypeScript type checking, automated tests, production build, and release-boundary verification. `Dependency audit` checks both dependency trees for high/critical advisories. `Browser E2E` covers deterministic extension-owned browser flows.

Synthetic E2E is not proof of live YouTube or YouTube Music compatibility. Live/manual validation is required for browser/site-owned behavior affected by a release.

## v1.1.1 release-candidate workflow

1. Start from the latest protected `main` after #130 is merged and its targeted live regression validation has passed.
2. Create `release/v1.1.1` from that exact `main` SHA.
3. Set both `package.json` and `public/manifest.json` to `1.1.1`.
4. Synchronize release-facing README/store/release documentation with the exact shipped hotfix behavior.
5. Open a focused release-prep PR linked to #131.
6. Require `Validate`, `Dependency audit`, and `Browser E2E` to pass on the release-prep head.
7. Because the behavioral fix was already manually validated on #130 and release-prep must not change runtime behavior, do not repeat the full historical smoke matrix. Perform only the minimal release sanity described below unless release-prep introduces a runtime change.
8. Squash merge the release-prep PR. The resulting `main` SHA becomes the exact v1.1.1 candidate intended for packaging/publication.
9. Confirm required CI is green for the release-prep head and no unresolved manual regression exists.
10. Check out the exact candidate locally and run `pnpm validate`.
11. Run `pnpm package:release` from the same SHA. This reruns release verification before creating the deterministic ZIP.
12. Inspect `floatplay-1.1.1.zip`, record its SHA-256, and confirm the archive was produced from the exact candidate SHA.
13. Upload only that ZIP to the Chrome Web Store and review the store/privacy/site-access disclosures against the candidate.
14. After the Chrome Web Store update is published, create tag `v1.1.1` on the exact released SHA and publish the GitHub Release.
15. Mark #131 complete only after Chrome Web Store publication, tag creation, and GitHub Release publication are confirmed.

If any package-relevant change is required after the release-prep merge, stop. The new merged SHA becomes a new candidate and candidate-specific CI/validation/package checks must be repeated.

## Targeted v1.1.1 manual regression

The #130 live validation is authoritative for the changed behavior and must not be repeated merely because the version number changes.

The validated behavior is:

- with click-on-video Play/Pause enabled, the PiP video no longer applies hover dimming;
- the pointer cursor remains available as the clickability affordance;
- clicking the video image toggles Play/Pause exactly once;
- the behavior is stable while paused and while playing;
- with the preference disabled, the video remains passive and FloatPlay does not apply the pointer cursor;
- controls remain independently interactive.

After release-prep is merged, perform only a minimal sanity check if desired: open and close FloatPlay once on regular YouTube, confirm click-on-video Play/Pause still behaves as above when enabled, and confirm no release-blocking runtime error appears. A broader live regression is required only if release-prep changes runtime code.

## Release package contract

`pnpm package:release` first runs `pnpm verify:release`, which rebuilds `dist/`, verifies package/manifest version synchronization, validates the reviewed manifest allowlist, checks source/built manifest equality, rejects source maps, verifies packaged PNG icons, and confirms required files/locales exist.

The packager then creates deterministic `floatplay-<version>.zip` from verified `dist/`. It:

- includes only regular files from `dist/`;
- places `manifest.json` at the archive root;
- rejects `.map` entries and unsafe paths;
- writes entries in deterministic order with fixed ZIP timestamps;
- verifies that ZIP entries match `dist/` exactly;
- adds no runtime dependency.

Generated `floatplay-*.zip` files are ignored by Git and must not be committed.

## Package inspection for v1.1.1

Before upload, confirm at minimum:

- `manifest.json` is at the archive root and reports `1.1.1`;
- `content.js`, `youtube-player-main.js`, `service-worker.js`, `options.html`, `options.js`, and `options.css` are present;
- `_locales/en/messages.json` and `_locales/pt_BR/messages.json` are present;
- required extension icons and `brand/icon.svg` are present and valid;
- no `.map`, TypeScript source, tests, `.git`, `.env`, private-key files, or `node_modules` are present;
- archive entries exactly match verified `dist/`;
- the SHA-256 of the exact uploaded ZIP is recorded with the candidate SHA.

## Chrome Web Store and privacy review

Immediately before submission, review `docs/WEB_STORE.md`, `docs/PRIVACY.md`, `.github/SECURITY.md`, and the production manifest against the exact candidate.

The v1.1.1 hotfix does not change data handling, permissions, site access, persisted storage, or MAIN-world responsibilities relative to v1.1.0. Existing privacy disclosures therefore remain applicable, but they must still be reviewed against the exact candidate before submission.

The listing/privacy disclosures must continue to accurately describe:

- local processing of supported YouTube/YouTube Music page and media state;
- synchronized FloatPlay preferences and the device-local onboarding flag;
- the narrow same-tab MAIN-world playback bridge;
- explicit access to standard YouTube and `music.youtube.com`;
- no FloatPlay backend, analytics, telemetry, authentication, advertising SDKs, or FloatPlay viewing/listening-history service.

## Final v1.1.1 gate

The v1.1.1 package passed the candidate validation, package inspection, Chrome Web Store review, and publication gates recorded above. The exact released candidate remains immutable for release metadata purposes even if `main` advances with later documentation or development commits.
