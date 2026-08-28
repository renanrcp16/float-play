# FloatPlay Release Readiness

This document is the canonical checklist for preparing a FloatPlay release candidate and Chrome Web Store upload package. It does not authorize publication by itself.

## Current release status

- Public stable: `v1.1.1`
- Current release target: `v1.1.2`
- Release type: focused patch hotfix
- Release branch: `release/v1.1.2`
- Release issue: #136
- Runtime baseline before release prep: `eafc821b1ff8f7dc5ca00827b4426a1524caf49b`

`package.json` and `public/manifest.json` must remain synchronized. Any package-relevant change after candidate validation creates a new candidate SHA and invalidates candidate-specific validation/package records.

Existing release tags are immutable. Do not move or recreate `v1.0.0`, `v1.1.0`, or `v1.1.1`.

## v1.1.2 scope

`v1.1.2` contains the focused YouTube live Picture-in-Picture timeline fix merged in #135:

- detect active live playback without relying only on non-finite `HTMLVideoElement.duration`;
- use YouTube's native live DVR coordinate space for live timeline positioning and seek requests;
- route live seeks through the existing same-page YouTube player bridge instead of writing converted live coordinates to `video.currentTime`;
- keep accepted live seeks synchronized in FloatPlay while YouTube settles asynchronous player state;
- show only `LIVE` / `AO VIVO` for live broadcasts instead of an unstable numeric DVR clock;
- make the live label an action that jumps to the live edge;
- preserve normal finite-duration VOD elapsed/remaining behavior and existing YouTube Music behavior.

No unrelated feature work belongs in this release.

## Security/privacy contract

The v1.1.2 hotfix does not change the approved security/privacy surface relative to v1.1.1:

- Manifest V3;
- minimum Chrome version 130;
- explicit permission: `storage` only;
- no `host_permissions`, optional permissions, or optional host permissions;
- content-script scope limited to `https://www.youtube.com/*`, `https://youtube.com/*`, and `https://music.youtube.com/*`;
- one narrow MAIN-world YouTube player bridge plus one isolated FloatPlay content script on those origins;
- service worker `service-worker.js`;
- Options Page `options.html`;
- CSP `default-src 'self'`;
- external messaging closed with empty `externally_connectable.ids`;
- only `brand/icon.svg` exposed as a web-accessible resource on approved YouTube origins;
- no backend, analytics, telemetry, authentication, advertising SDK, remote executable code, or runtime-loaded external script dependency;
- no production source maps in the release package.

The existing MAIN-world bridge remains same-window/same-origin and accepts only reviewed playback actions such as volume, mute, playback rate, seek, and supported YouTube Music queue navigation. v1.1.2 reuses that existing seek path for live DVR coordinates; it does not add a new bridge message type or permission.

Any expansion of permissions, hosts, MAIN-world responsibilities, web-accessible resources, external messaging, remote code, storage/data handling, or network behavior requires a new security/privacy review before release.

## Required CI

Release-prep PRs targeting `main` must pass:

- `Validate`
- `Dependency audit`
- `Browser E2E`

Synthetic E2E is not proof of live YouTube compatibility. The #135 targeted real-site validation is authoritative for the live behavior changed by this hotfix and should not be repeated merely because release-facing version/docs change.

## v1.1.2 release workflow

1. Start from `main` after #135 is merged and its targeted live validation has passed.
2. Create `release/v1.1.2` from exact baseline SHA `eafc821b1ff8f7dc5ca00827b4426a1524caf49b`.
3. Set both package and manifest versions to `1.1.2`.
4. Synchronize README, release, and Chrome Web Store documentation with the exact hotfix behavior.
5. Open a focused release-prep PR linked to #136.
6. Require `Validate`, `Dependency audit`, and `Browser E2E` to pass.
7. Squash merge the release-prep PR. The resulting `main` SHA becomes the exact v1.1.2 candidate.
8. On that exact SHA, run local `pnpm validate`.
9. Run `pnpm package:release` from the same SHA.
10. Inspect `floatplay-1.1.2.zip`, record its byte size and SHA-256, and confirm the archive matches verified `dist/`.
11. Upload only that exact ZIP to the Chrome Web Store and review privacy/site-access disclosures.
12. After Chrome Web Store publication is confirmed, create tag `v1.1.2` on the exact released SHA and publish a GitHub Release with the same ZIP.
13. Close #136 only after Store publication, tag, and GitHub Release are confirmed.

If any package-relevant change is required after the release-prep merge, stop and treat the new merged SHA as a new candidate.

## Release package contract

`pnpm package:release` runs `pnpm verify:release`, rebuilds `dist/`, verifies package/manifest version synchronization, validates the reviewed manifest allowlist, verifies PNG icons and required files/locales, rejects production source maps, and then creates deterministic `floatplay-<version>.zip` from verified `dist/`.

Before upload, confirm at minimum:

- `manifest.json` is at the archive root and reports `1.1.2`;
- `content.js`, `youtube-player-main.js`, `service-worker.js`, `options.html`, `options.js`, and `options.css` are present;
- `_locales/en/messages.json` and `_locales/pt_BR/messages.json` are present;
- required icons and `brand/icon.svg` are present;
- no `.map`, TypeScript source, tests, `.git`, `.env`, private keys, or `node_modules` are present;
- archive entries match verified `dist/`;
- the SHA-256 and byte size of the exact uploaded ZIP are recorded with the candidate SHA.

## Store/privacy review

Immediately before submission, review `docs/WEB_STORE.md`, `docs/PRIVACY.md`, `.github/SECURITY.md`, and `public/manifest.json` against the exact candidate.

v1.1.2 changes live timeline/player synchronization only. It does not change data collection, persisted settings, permissions, site access, backend/network behavior, analytics/telemetry, or authentication. Existing privacy disclosures therefore remain applicable.

## Final gate

Do not tag or publish the GitHub Release before the exact v1.1.2 package is published on the Chrome Web Store. The release tracker #136 remains open until all publication steps are complete.
