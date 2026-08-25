# FloatPlay Chrome Web Store Notes

This document prepares Chrome Web Store metadata and reviewer-facing explanations. Re-check the Chrome Web Store dashboard and current policies immediately before each submission because store requirements can change independently of this repository.

## Current package identity

- Name: FloatPlay
- Published stable version: `1.1.1`
- Current release target: none
- Last release type: focused patch hotfix
- Manifest: Manifest V3
- Default locale: English
- Additional locale: Brazilian Portuguese
- Minimum Chrome version: 130
- Current explicit permission: `storage`
- Current content-script scope: `https://www.youtube.com/*`, `https://youtube.com/*`, and `https://music.youtube.com/*`
- Extension-page CSP: `default-src 'self'`
- External messaging: explicitly closed with an empty `externally_connectable.ids` allowlist and no web-page match patterns
- Web-accessible resource exposure: only `brand/icon.svg` on the approved YouTube origins

FloatPlay `1.1.1` is publicly available on the Chrome Web Store. The published package was produced from exact candidate SHA `e3da74ff968ed79709a99a09ef53cb0206daaed0`.

## v1.1.1 publication record

- Chrome Web Store publication confirmed on 2026-08-25.
- Release ZIP: `floatplay-1.1.1.zip` (`16` files, `134383` bytes).
- Release ZIP SHA-256: `AE6C13B2B9C438C95050C310FB345250C31A872A3936EFC83AC1D1D624D302FB`.
- No new permission, site-access, privacy, storage, MAIN-world, backend/network, analytics/telemetry, or runtime dependency scope was introduced.

## v1.1.1 hotfix scope

The exact v1.1.1 change is intentionally narrow:

- remove unreliable hover dimming from the clickable PiP video surface because Chrome could intermittently leave that visual state stuck after the pointer exited the Document Picture-in-Picture window;
- preserve optional click-on-video Play/Pause;
- preserve the pointer cursor as the clickability affordance when that preference is enabled.

The hotfix does not add a feature, permission, site, persisted field, MAIN-world action, network path, dependency, or data-handling behavior.

Chrome Web Store update note prepared for this release:

> Fixes an intermittent Picture-in-Picture visual issue where the video could remain dark after the pointer left the mini player. Click-to-Play/Pause behavior remains available when enabled.

Prepared pt-BR equivalent:

> Corrige um problema visual intermitente no Picture-in-Picture em que o vídeo podia permanecer escurecido após o mouse sair do mini player. O clique para Reproduzir/Pausar continua disponível quando habilitado.

The Chrome Web Store dashboard did not require a dedicated release-note field for this update, so the listing description and screenshots were left unchanged.

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

FloatPlay uses an isolated content script for extension logic plus one narrow MAIN-world bridge on the same approved YouTube origins. The bridge accepts only validated same-page playback actions for volume, mute, playback rate, YouTube Music current-track seek, and YouTube Music previous/next track navigation.

The bridge has no Chrome storage/runtime access, backend access, analytics, or user identifiers. FloatPlay does not request access to unrelated websites.

## Release security posture

The production Manifest is an explicit security allowlist rather than an open-ended configuration file.

The release verifier fails if the extension gains an unreviewed manifest key or changes security-sensitive values such as permissions, host scope, external connection allowances, content-script files/worlds/timing, background worker, CSP, or web-accessible resources.

The v1.1.1 hotfix intentionally keeps the v1.1.0 security posture unchanged:

- Chrome 130 minimum supported version;
- only explicit permission `storage`;
- no broad `host_permissions` grant;
- no optional permissions or optional host permissions;
- content-script matches limited to the approved YouTube origins;
- an explicit `externally_connectable` policy with no allowed extension IDs and no allowed web-page matches;
- no sandboxed extension pages;
- no remote executable code;
- no runtime-loaded external script dependency;
- an explicit `default-src 'self'` CSP for extension pages and the service worker;
- no production source maps in `dist/` or the Chrome Web Store ZIP.

The release ZIP is generated only from verified `dist/`. Any future expansion of this security surface requires an intentional source change, verifier allowlist change, documentation update, and fresh security/privacy review before release.

## Data handling

FloatPlay handles only data required to provide its disclosed single purpose.

While active on a supported YouTube or YouTube Music page, FloatPlay reads current media and page state needed for playback behavior, such as current-track time/duration, paused state, volume, mute state, playback rate, seekable ranges, active media identity, and supported-surface/DOM context.

This state is processed inside the browser to provide the mini player. FloatPlay does not retain, build, or transmit its own database of YouTube viewing or YouTube Music listening history.

User-selected FloatPlay settings are stored with Chrome extension storage. When Chrome sync is enabled, Chrome may synchronize those settings as part of the browser's own sync infrastructure. The first-use coachmark seen flag remains device-local in `chrome.storage.local`.

FloatPlay does not include a FloatPlay backend, authentication, third-party analytics, advertising SDKs, operational telemetry, or a FloatPlay watch/listening-history service. The v1.1.1 hotfix changes none of these data-handling behaviors.

`docs/PRIVACY.md` remains the canonical public privacy-policy text and includes the Chrome Web Store Limited Use disclosure.

## Store assets

No new store screenshot or promotional asset was required for v1.1.1 because the hotfix removes an unreliable transient hover treatment and does not introduce a new advertised feature.

Existing screenshots and listing descriptions remain valid as long as they do not specifically depict or promise PiP video hover dimming.

The extension package contains branded 16, 32, 48, and 128 pixel icons, including the verified 128x128 installation/store artwork. The Options Page screenshot workflow remains available through:

```bash
pnpm capture:store-screenshot
```

## v1.1.1 submission record

The v1.1.1 submission used the exact validated ZIP recorded above. The dashboard accepted the package, automatic publication was enabled, and publication was later confirmed. No listing-description or screenshot change was required for this hotfix.

## Final dashboard review

Immediately before any future submission, verify that:

- the single-purpose statement matches the shipped extension;
- permission and site-access justifications match `public/manifest.json`;
- the Chrome 130 baseline, reviewed manifest allowlist, explicit CSP, and closed external-messaging policy match the candidate;
- privacy disclosures describe all data handling, including local media/page processing, Chrome storage sync, the device-local onboarding flag, and same-tab player synchronization/navigation;
- the public privacy-policy URL works;
- the support URL works and public support guidance does not ask users to disclose private information;
- listing text and screenshots remain accurate for the shipped product;
- no unsupported claims, rankings, badges, or comparative marketing have been added;
- the uploaded ZIP contains `manifest.json` at its root, reports the intended release version, and contains no source maps or unexpected repository artifacts.
