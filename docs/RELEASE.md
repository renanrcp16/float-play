# FloatPlay Release Readiness

This document is the canonical checklist for preparing a FloatPlay release candidate and Chrome Web Store upload package. It does not authorize publication by itself.

## Current release status

- Public stable: `v1.0.0`
- Current release target: `v1.1.0`
- Release branch: `release/v1.1.0`

The version in `package.json` and `public/manifest.json` must remain synchronized. Any source, manifest, release-facing documentation, or package-relevant change after a candidate is validated creates a new candidate SHA and invalidates validation recorded against the older SHA.

Do not move or recreate the existing `v1.0.0` tag. Do not create the `v1.1.0` tag until the final candidate has been validated and the Chrome Web Store update has been published, unless the release policy is explicitly changed.

## Release security contract

The current release manifest is intentionally allowlisted. `pnpm verify:release` must fail when a security-sensitive capability changes without an intentional engineering/security review.

The approved v1.1.0 contract requires:

- Manifest V3;
- minimum Chrome version 130;
- the single explicit permission `storage`;
- no `host_permissions`, optional permissions, optional host permissions, or sandbox pages;
- content scripts limited to `https://www.youtube.com/*`, `https://youtube.com/*`, and `https://music.youtube.com/*`;
- exactly one isolated FloatPlay content script and one narrow MAIN-world YouTube player bridge on those origins;
- the service worker `service-worker.js`;
- the Options Page `options.html`;
- exactly one web-accessible resource group exposing only `brand/icon.svg` to the approved YouTube origins;
- extension-page CSP `default-src 'self'`;
- external messaging closed with an empty `externally_connectable.ids` allowlist and no web-page match patterns;
- no remote executable code, backend, analytics, telemetry, authentication, or runtime-loaded external script dependency;
- no production source maps in `dist/` or the Chrome Web Store ZIP.

The MAIN-world bridge remains same-window/same-origin and accepts only the reviewed playback synchronization actions: volume, mute, playback rate, YouTube Music current-track seek, and YouTube Music previous/next track navigation.

Any new manifest key, permission, host, external connection allowance, execution world, content script, web-accessible resource, remote code path, backend dependency, or expanded data handling requires a fresh architecture/security/privacy review before release.

## Required CI

Pull requests targeting `main` must pass these required checks:

- `Validate`
- `Dependency audit`
- `Browser E2E`

`Validate` includes lint, TypeScript type checking, automated tests, production build, and release-boundary verification. `Dependency audit` checks both dependency trees for high/critical advisories. `Browser E2E` covers deterministic extension-owned browser flows.

Synthetic E2E is not proof of live YouTube or YouTube Music compatibility. Live/manual validation is required only for browser/site-owned behavior affected by the release.

## v1.1.0 release-candidate workflow

1. Start from the latest protected `main` after all planned v1.1.0 feature/fix PRs are merged and manually validated where required.
2. Create `release/v1.1.0` from that exact `main` SHA.
3. Set both `package.json` and `public/manifest.json` to `1.1.0`.
4. Synchronize README, architecture, privacy, testing/store notes, and release documentation with the exact shipped behavior.
5. Open a focused release-prep PR linked to issue #127.
6. Require `Validate`, `Dependency audit`, and `Browser E2E` to pass on the release-prep head.
7. Perform the targeted v1.1.0 manual regression set below. Do not repeat the complete historical v1 smoke matrix unless a new change invalidates one of those old results.
8. Squash merge the release-prep PR. The resulting `main` SHA becomes the exact v1.1.0 candidate intended for packaging/publication.
9. Confirm required CI is green on that exact candidate SHA.
10. Check out that exact candidate locally and run `pnpm validate`.
11. Run `pnpm package:release` from the same SHA. This reruns release verification before creating the deterministic ZIP.
12. Inspect `floatplay-1.1.0.zip`, record its SHA-256, and confirm the archive was produced from the exact candidate SHA.
13. Upload only that ZIP to the Chrome Web Store and review the store/privacy/site-access disclosures against the candidate.
14. After the Chrome Web Store update is published, create tag `v1.1.0` on the exact released SHA and publish the GitHub Release.

If any package-relevant change is required after step 8, stop. The new merged SHA becomes a new candidate and the candidate-specific CI/validation/package checks must be repeated.

## Targeted v1.1.0 manual regression set

The v1.1.0 final smoke focuses on changed behavior and directly affected critical paths:

- **Regular YouTube / PiP click:** default setting OFF leaves the PiP video surface passive; enabling the option makes only the video image clickable with the approved hover/pointer feedback; controls remain independently usable.
- **Regular YouTube / Audio-only:** Audio-only hides video, keeps controls visible, persists across sessions, closes overflow state correctly, and `Show video` restores the normal video geometry.
- **Small PiP volume:** in narrow/Audio-only PiP the horizontal volume slider keeps its approved background, does not overlap controls, and the volume icon remains pixel-stable on hover/focus.
- **Original YouTube surface:** the non-interactive original player area toggles Play/Pause and shows pointer only inside the eligible player area; native controls are never intercepted. Include the known regression videos recorded in issue #115.
- **YouTube Music entry:** the FloatPlay trigger remains inside the right player control group without compressing the native volume control.
- **YouTube Music Audio-only:** PiP opens directly in mandatory Audio-only mode and does not expose a restore-video action.
- **YouTube Music synchronization:** volume/mute remains synchronized both directions, current-track timeline/duration stays relative to the active track, and timeline seeking does not skip tracks accidentally.
- **YouTube Music track transitions:** natural/explicit track changes keep PiP open and update active media/timeline correctly.
- **YouTube Music navigation:** primary controls render as Previous track → seek backward → Play/Pause → seek forward → Next track, fit in compact geometry without overlap, and Previous/Next delegate to native queue navigation.
- **Minimal lifecycle sanity:** open/close PiP once on regular YouTube and once on YouTube Music; confirm the active media is safely restored/continued and no release-blocking FloatPlay runtime error appears.

A behavior already manually validated on the final feature branch does not need to be repeated before the release-prep merge unless the release-prep changes touch that behavior. The exact-candidate sanity pass after merge should remain minimal and focused on packaging/version-sensitive confidence.

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

## Package inspection for v1.1.0

Before upload, confirm at minimum:

- `manifest.json` is at the archive root and reports `1.1.0`;
- `content.js`, `youtube-player-main.js`, `service-worker.js`, `options.html`, `options.js`, and `options.css` are present;
- `_locales/en/messages.json` and `_locales/pt_BR/messages.json` are present;
- required extension icons and `brand/icon.svg` are present and valid;
- no `.map`, TypeScript source, tests, `.git`, `.env`, private-key files, or `node_modules` are present;
- archive entries exactly match verified `dist/`;
- the SHA-256 of the exact uploaded ZIP is recorded with the candidate SHA.

## Chrome Web Store and privacy review

Immediately before submission, review `docs/WEB_STORE.md`, `docs/PRIVACY.md`, `.github/SECURITY.md`, and the production manifest against the exact candidate.

The listing/privacy disclosures must accurately describe:

- local processing of supported YouTube/YouTube Music page and media state;
- synchronized FloatPlay preferences and the device-local onboarding flag;
- the narrow same-tab MAIN-world playback bridge;
- explicit access to standard YouTube and `music.youtube.com`;
- no FloatPlay backend, analytics, telemetry, authentication, advertising SDKs, or FloatPlay viewing/listening-history service.

Adding `music.youtube.com` expands site access relative to v1.0.0. Before submitting the update, verify the Chrome Web Store dashboard's current site-access/privacy presentation and ensure reviewer-facing justification matches the exact manifest.

## Final v1.1.0 gate

Do not submit the update until all of the following are true:

- package and manifest both report `1.1.0`;
- all planned scope in #110 is complete;
- release-prep PR required CI is green;
- requested live/manual regression validation has passed;
- the exact merged candidate SHA has green required CI;
- local `pnpm validate` passes on the exact candidate;
- `pnpm package:release` succeeds on that exact candidate;
- `floatplay-1.1.0.zip` is inspected and its SHA-256 recorded;
- permission/site-access/privacy/store claims match shipped behavior;
- listing copy/screenshots match the submitted version;
- privacy-policy and support URLs are publicly reachable;
- `v1.0.0` remains unchanged;
- `v1.1.0` is not tagged until the publication step defined above.
