# FloatPlay Chrome Web Store Notes

This document prepares Chrome Web Store metadata and reviewer-facing explanations. Re-check the Chrome Web Store dashboard and current policies immediately before each submission because store requirements can change independently of this repository.

## Current package identity

- Name: FloatPlay
- Published stable version: `1.0.0`
- Next release target: `1.1.0`
- Manifest: Manifest V3
- Default locale: English
- Additional locale: Brazilian Portuguese
- Minimum Chrome version: 130
- Current explicit permission: `storage`
- Current content-script scope: `https://www.youtube.com/*`, `https://youtube.com/*`, and `https://music.youtube.com/*`
- Extension-page CSP: `default-src 'self'`
- External messaging: explicitly closed with an empty `externally_connectable.ids` allowlist and no web-page match patterns
- Web-accessible resource exposure: only `brand/icon.svg` on the approved YouTube origins

The published Chrome Web Store package remains `1.0.0` until the exact `1.1.0` candidate passes the release gate and is submitted. Repository documentation must describe the development line accurately without implying that unreleased features are already present in the store package.

## Public release links

Use these public URLs in the Chrome Web Store dashboard:

- Privacy policy: `https://github.com/renanrcp16/float-play/blob/main/docs/PRIVACY.md`
- Support: `https://github.com/renanrcp16/float-play/issues`

The privacy-policy URL points to the policy tracked with `main` and must remain synchronized with every release that changes data handling.

The support URL is a public issue tracker. Users must not be asked to post personal, sensitive, account, authentication, payment, or other private information there. A privacy request that requires private information should first request a private contact channel using maintainer contact information available from the maintainer's GitHub profile.

Immediately before submission, confirm both URLs are publicly reachable from the Chrome Web Store dashboard.

## Single purpose

FloatPlay enhances supported YouTube and YouTube Music Picture-in-Picture experiences with a compact mini player and richer playback controls while keeping operation local-first and limited to the explicit YouTube origins required by the product.

## Permission and site-access justification

### `storage`

FloatPlay uses Chrome extension storage to persist user preferences such as backward and forward seek intervals, volume adjustment step, automatic control hiding, auto-hide delay, elapsed/remaining time display preference, optional PiP video-surface Play/Pause, and the standard-YouTube Audio-only preference. It also stores one device-local boolean flag recording that the first-use trigger coachmark has already been seen.

User-selected player preferences use `chrome.storage.sync` when available, so Chrome may synchronize those preferences through the user's Chrome account according to browser settings. The first-use coachmark flag uses `chrome.storage.local`. FloatPlay does not operate a backend that receives either preferences or onboarding state.

### YouTube content-script access

FloatPlay injects content scripts only on the YouTube origins needed by the product: standard YouTube and YouTube Music. This access is required to:

- detect supported YouTube watch pages and YouTube Music player surfaces;
- identify the active player media element;
- open and manage the user-requested Document Picture-in-Picture session;
- move and safely restore the active media element;
- follow YouTube Music media changes during track transitions;
- read the current-track YouTube Music timeline when the underlying media timestamp is cumulative;
- request current-track seek and native previous/next queue navigation on YouTube Music;
- keep controls synchronized with media/player state;
- support YouTube SPA behavior and playlist/track progression;
- provide the FloatPlay trigger and first-use trigger guidance.

FloatPlay uses an isolated content script for extension logic plus one narrow MAIN-world bridge on the same approved YouTube origins. The bridge accepts only validated same-page playback actions for volume, mute, playback rate, YouTube Music current-track seek, and YouTube Music previous/next track navigation. Those YouTube Music paths are needed because the underlying media element can expose cumulative timestamps and does not reliably represent native queue navigation by direct media-time manipulation alone.

The bridge has no Chrome storage/runtime access, backend access, analytics, or user identifiers. FloatPlay does not request access to unrelated websites.

## Release security posture

The production Manifest is an explicit security allowlist rather than an open-ended configuration file.

The release verifier fails if the extension gains an unreviewed manifest key or changes security-sensitive values such as permissions, host scope, external connection allowances, content-script files/worlds/timing, background worker, CSP, or web-accessible resources.

The current package intentionally has:

- Chrome 130 as its minimum supported version;
- no broad `host_permissions` grant;
- no optional permissions or optional host permissions;
- content-script matches limited to the three approved YouTube origins;
- an explicit `externally_connectable` policy with no allowed extension IDs and no allowed web-page matches;
- no sandboxed extension pages;
- no remote executable code;
- no runtime-loaded external script dependency;
- an explicit `default-src 'self'` CSP for extension pages and the service worker;
- no production source maps in `dist/` or the Chrome Web Store ZIP.

The release ZIP is generated only from verified `dist/`. Any future expansion of this security surface requires an intentional source change, verifier allowlist change, documentation update, and fresh security/privacy review before release.

## Data handling

FloatPlay handles only data required to provide its disclosed single purpose.

### Transient media/page state

While active on a supported YouTube or YouTube Music page, FloatPlay reads current media and page state needed for playback behavior, such as current-track time/duration, paused state, volume, mute state, playback rate, seekable ranges, active media identity, and supported-surface/DOM context.

This state is processed inside the browser to provide the mini player. FloatPlay does not retain, build, or transmit its own database of YouTube viewing or YouTube Music listening history.

The same-page playback bridge receives only the requested playback action and its value/direction. That communication stays inside the active supported YouTube tab and is not transmitted to FloatPlay infrastructure.

### Persisted preferences

User-selected FloatPlay settings are stored with Chrome extension storage. When Chrome sync is enabled, Chrome may synchronize those settings as part of the browser's own sync infrastructure.

The standard-YouTube Audio-only choice is a persisted preference. YouTube Music always opens in Audio-only mode as part of that supported surface and does not expose a restore-video action.

### Local onboarding state

After the user opens FloatPlay from its trigger or dismisses the first-use coachmark, FloatPlay stores one boolean seen state in local Chrome extension storage so the tip is not repeatedly shown. The flag does not include video identifiers, URLs, timestamps, analytics identifiers, or browsing history.

### What FloatPlay does not do

FloatPlay does not include a FloatPlay backend, authentication, third-party analytics, advertising SDKs, operational telemetry, or a FloatPlay watch/listening-history service. The project does not sell user data or transmit YouTube viewing/listening activity to FloatPlay infrastructure.

`docs/PRIVACY.md` is the canonical public privacy-policy text and includes the Chrome Web Store Limited Use disclosure.

## Store listing notes for v1.1.0

The exact v1.1.0 feature set is:

- YouTube Music support with mandatory Audio-only Picture-in-Picture;
- current-track YouTube Music timeline and seek behavior;
- primary Previous/Next track controls for YouTube Music;
- persistent Audio-only preference for standard YouTube;
- optional click-on-video Play/Pause inside the PiP window, disabled by default;
- improved compact/small-PiP volume layout and hover stability;
- more reliable Play/Pause on the original YouTube player surface while PiP is active.

Suggested concise update/release note:

> FloatPlay 1.1.0 adds YouTube Music support, Audio-only playback, previous/next track controls, optional click-to-play/pause in PiP, and compact-player interaction fixes.

The public English and Brazilian Portuguese descriptions must describe only the exact shipped behavior. Do not claim that `1.1.0` is publicly available until the Chrome Web Store update is published.

## Store assets

The extension package contains branded 16, 32, 48, and 128 pixel icons, including the verified 128x128 installation/store artwork. The Options Page screenshot workflow remains available through:

```bash
pnpm capture:store-screenshot
```

Real YouTube/YouTube Music FloatPlay PiP screenshots remain manual assets because live site behavior and Document Picture-in-Picture are intentionally outside the deterministic browser automation boundary.

Dashboard screenshots and promotional artwork must show the actual current product experience and must not advertise unsupported behavior.

## Before the v1.1.0 submission

Before clicking Submit for Review:

- confirm the manifest/package version is `1.1.0` on the exact frozen candidate;
- make sure the English and pt-BR dashboard listing copy matches the shipped feature set;
- confirm Privacy practices and Limited Use disclosures still match `docs/PRIVACY.md` and shipped behavior;
- confirm the public privacy-policy and support URLs are accepted by the dashboard;
- re-check how the added `music.youtube.com` content-script scope is presented in the Chrome Web Store/site-access disclosure for the update;
- confirm the active `Protect main` ruleset requires `Validate`, `Dependency audit`, and `Browser E2E`;
- run the exact-candidate gates and targeted real Chrome smoke from `docs/RELEASE.md`;
- run `pnpm package:release` on the exact final candidate and inspect `floatplay-1.1.0.zip`;
- upload only the ZIP produced from the exact validated candidate.

## Final dashboard review

Immediately before submission, verify that:

- the single-purpose statement matches the shipped extension;
- permission and site-access justifications match `manifest.json`;
- the Chrome 130 baseline, reviewed manifest allowlist, explicit CSP, and closed external-messaging policy match the candidate;
- privacy disclosures describe all data handling, including local media/page processing, Chrome storage sync, the device-local onboarding flag, and same-tab player synchronization/navigation;
- the public privacy-policy URL works;
- the support URL works and public support guidance does not ask users to disclose private information;
- listing text and screenshots match version `1.1.0`;
- no unsupported claims, rankings, badges, or comparative marketing have been added;
- the uploaded ZIP contains `manifest.json` at its root, reports version `1.1.0`, and contains no source maps or unexpected repository artifacts.
