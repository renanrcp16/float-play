# FloatPlay Chrome Web Store Notes

This document prepares Chrome Web Store metadata and reviewer-facing explanations. Re-check the Chrome Web Store dashboard and current policies immediately before each submission because store requirements can change independently of this repository.

## Current package identity

- Name: FloatPlay
- Published stable version: `1.1.2`
- Current release target: none
- Last release type: focused patch hotfix
- Manifest: Manifest V3
- Default locale: English
- Additional locale: Brazilian Portuguese
- Minimum Chrome version: 130
- Explicit permission: `storage`
- Content-script scope: `https://www.youtube.com/*`, `https://youtube.com/*`, and `https://music.youtube.com/*`
- Extension-page CSP: `default-src 'self'`
- External messaging: closed with empty `externally_connectable.ids`
- Web-accessible resource exposure: only `brand/icon.svg` on approved YouTube origins

## v1.1.2 publication record

- Chrome Web Store publication confirmed on 2026-08-31.
- Exact released candidate SHA: `33f8aac63a4ec53fb8485e7a8052ff6479c6dfd0`.
- Release ZIP: `floatplay-1.1.2.zip` (`16` files, `137209` bytes).
- Release ZIP SHA-256: `7F5F9D0C036F9F4FB187E8B7CF6268514C3B074DC0107D2CB60A28FCBFF82247`.
- GitHub Release: `https://github.com/renanrcp16/float-play/releases/tag/v1.1.2`.
- No permission, site-access, persisted-setting, privacy, backend/network, analytics/telemetry, dependency, or MAIN-world message-type expansion was introduced.

## v1.1.2 hotfix scope

This release fixes Picture-in-Picture timeline behavior for YouTube live streams with DVR history:

- uses YouTube's native live DVR coordinate space for seeking;
- keeps the FloatPlay slider synchronized after asynchronous live seeks;
- avoids writing converted live coordinates directly to `HTMLVideoElement.currentTime`;
- shows a stable `LIVE` / `AO VIVO` action instead of an unreliable numeric DVR clock;
- clicking the live label jumps to the live edge;
- preserves regular VOD elapsed/remaining behavior and existing YouTube Music behavior.

The release does not add a new permission, host, persisted setting, data-handling behavior, backend/network path, analytics/telemetry, dependency, or new MAIN-world message type.

## Update note used for this release

English:

> Fixes Picture-in-Picture timeline behavior for YouTube live streams, including more reliable DVR seeking and a stable LIVE action that jumps to the current live edge.

Brazilian Portuguese:

> Corrige o comportamento da timeline do Picture-in-Picture em transmissões ao vivo do YouTube, com navegação DVR mais confiável e uma ação AO VIVO que retorna ao ponto mais recente da transmissão.

No listing-description or screenshot change was required solely for this focused hotfix.

## Public release links

- Privacy policy: `https://github.com/renanrcp16/float-play/blob/main/docs/PRIVACY.md`
- Support: `https://github.com/renanrcp16/float-play/issues`

Immediately before submission, confirm both URLs remain publicly reachable.

## Single purpose

FloatPlay enhances supported YouTube and YouTube Music Picture-in-Picture experiences with a compact mini player and richer playback controls while keeping operation local-first and limited to the explicit YouTube origins required by the product.

## Permission and site-access justification

### `storage`

FloatPlay uses Chrome extension storage for user preferences such as seek intervals, volume adjustment step, control auto-hide settings, elapsed/remaining time display preference, optional PiP video-surface Play/Pause, and the standard-YouTube Audio-only preference. The first-use trigger coachmark flag remains device-local.

User-selected preferences use `chrome.storage.sync` when available; the onboarding flag uses `chrome.storage.local`. FloatPlay has no backend receiving either.

### YouTube access

FloatPlay runs only on supported standard YouTube and YouTube Music origins to identify the active player, manage Document Picture-in-Picture, synchronize playback controls, support YouTube SPA behavior, read timeline/player state, perform supported seek/navigation operations, and provide its trigger/onboarding UI.

The isolated content script performs extension logic. A narrow same-page MAIN-world bridge performs reviewed native player actions such as volume, mute, playback rate, seek, and supported YouTube Music queue navigation. v1.1.2 reuses the existing seek path for YouTube live DVR coordinates and adds no new bridge message type.

FloatPlay does not request unrelated website access.

## Security and privacy posture

v1.1.2 keeps the v1.1.1 release posture unchanged:

- no broad `host_permissions`;
- no optional permissions or optional hosts;
- no remote executable code;
- no runtime-loaded external script dependency;
- no backend, authentication, analytics, telemetry, advertising SDK, or FloatPlay viewing/listening-history service;
- no production source maps in the release ZIP;
- local processing of supported page/media/player state only as needed to provide the product;
- Chrome extension storage only for disclosed preferences/onboarding state.

`docs/PRIVACY.md` remains the canonical public privacy policy and includes the Chrome Web Store Limited Use disclosure.

## Store assets

No new screenshot or promotional asset was required for v1.1.2. The hotfix changes live timeline semantics and reliability without introducing a new advertised surface or changing the overall player layout.

Existing listing screenshots remain valid. The Options Page screenshot workflow remains:

```bash
pnpm capture:store-screenshot
```

## Final dashboard review

Immediately before any future submission verify that:

- the single-purpose statement matches the shipped extension;
- permission/site-access justifications match `public/manifest.json`;
- privacy disclosures match actual data handling;
- privacy-policy and support URLs work;
- listing text/screenshots remain accurate;
- no unsupported claims or comparative marketing were added;
- the uploaded ZIP contains `manifest.json` at the root, reports the intended version, and contains no source maps or repository artifacts.
