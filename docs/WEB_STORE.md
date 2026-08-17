# FloatPlay Chrome Web Store Draft

This document prepares Chrome Web Store metadata and reviewer-facing explanations from the currently implemented FloatPlay v1 behavior. Re-check the Chrome Web Store dashboard and policies immediately before submission because store requirements can change independently of this repository.

## Current package identity

- Name: FloatPlay
- Development version: `0.1.0`
- Manifest: Manifest V3
- Default locale: English
- Additional locale: Brazilian Portuguese
- Minimum Chrome version: 130
- Current explicit permission: `storage`
- Current content-script scope: `https://www.youtube.com/*` and `https://youtube.com/*`
- Extension-page CSP: `default-src 'self'`
- External messaging: explicitly closed with an empty `externally_connectable.ids` allowlist and no web-page match patterns
- Web-accessible resource exposure: only `brand/icon.svg` on the approved YouTube origins

Do not change the public release version to `1.0.0` until the v1 Definition of Done is complete.

## Public release links

Use these public URLs in the Chrome Web Store dashboard:

- Privacy policy: `https://github.com/renanrcp16/float-play/blob/main/docs/PRIVACY.md`
- Support: `https://github.com/renanrcp16/float-play/issues`

The privacy-policy URL points to the policy version tracked with the `main` branch. Keep the document synchronized with every release that changes data handling.

The support URL is a public issue tracker. Users must not be asked to post personal, sensitive, account, authentication, payment, or other private information there. Privacy requests that require private information should first request a private contact channel using the maintainer contact information available from the maintainer's GitHub profile.

## Single purpose

FloatPlay enhances YouTube Picture-in-Picture with a compact mini player and richer playback controls while keeping operation local-first and limited to supported YouTube watch experiences.

## Permission and site-access justification

### `storage`

FloatPlay uses Chrome extension storage to persist user preferences such as backward and forward seek intervals, volume adjustment step, automatic control hiding, auto-hide delay, and elapsed/remaining time display preference. It also stores one device-local boolean flag recording that the first-use trigger coachmark has already been seen.

The implementation uses `chrome.storage.sync` when available for user-selected player preferences so Chrome may synchronize those preferences through the user's Chrome account according to the user's browser settings. The first-use coachmark flag uses `chrome.storage.local` and is not a watch-history or analytics record. FloatPlay does not operate a backend that receives either the preferences or onboarding state.

### YouTube content-script access

FloatPlay injects content scripts only on YouTube origins needed by the product. This access is required to:

- detect supported YouTube watch pages and the active `HTMLVideoElement`;
- open and manage the user-requested Document Picture-in-Picture session;
- move and safely restore the active media element;
- keep controls synchronized with media playback state;
- support YouTube SPA navigation and playlist progression;
- provide the FloatPlay trigger, first-use trigger guidance, and the approved origin-surface playback interaction.

FloatPlay uses an isolated content script for extension logic plus one narrow MAIN-world bridge on the same approved YouTube origins. Playback state changes are applied to the active `HTMLVideoElement` first. The MAIN-world bridge is used only to mirror FloatPlay volume, mute, and playback-rate changes into YouTube's own player state when the corresponding page method exists. The bridge accepts only those three validated same-page message actions and has no Chrome storage/runtime access, backend access, analytics, or identifiers.

FloatPlay does not request access to unrelated websites.

## Release security posture

The production Manifest is treated as an explicit v1 security allowlist rather than an open-ended configuration file.

The release verifier requires the approved Manifest V3 structure and fails if the extension gains an unreviewed manifest key or changes security-sensitive values such as permissions, host scope, external connection allowances, content-script files/worlds/timing, background worker, CSP, or web-accessible resources.

The current package intentionally has:

- Chrome 130 as the minimum supported version so the declared baseline includes the complete reviewed Document Picture-in-Picture option set used by FloatPlay;
- no `host_permissions`;
- no optional permissions or optional host permissions;
- an explicit `externally_connectable` policy with no allowed extension IDs and no allowed web-page matches;
- no sandboxed extension pages;
- no remote executable code;
- no runtime-loaded external script dependency;
- an explicit `default-src 'self'` CSP for extension pages and the service worker;
- no production source maps in `dist/` or the Chrome Web Store ZIP.

The release ZIP is generated only from the verified `dist/` tree. The packager preserves deterministic ordering, places the manifest at the archive root, rejects unsafe paths and `.map` entries, and verifies that archive entries match `dist/` exactly.

Any future expansion of this security surface requires an intentional source change, verifier allowlist change, documentation update, and fresh security/privacy review before release.

## Data handling

FloatPlay handles only data required to provide its disclosed single purpose.

### Transient media/page state

While the extension is active on YouTube, it reads media and page state needed for playback behavior, such as playback time, paused state, volume, mute state, playback rate, seekable ranges, active media identity, and supported-route/DOM context.

This state is processed inside the browser to provide the mini player. FloatPlay does not retain, build, or transmit its own database of YouTube watch history; it processes the current supported page and media state only as needed for FloatPlay features.

The same-page playback bridge receives only the requested playback action and its value. That communication stays inside the active YouTube tab and is not transmitted to FloatPlay infrastructure.

### Persisted preferences

User-selected FloatPlay settings are stored with Chrome extension storage. When Chrome sync is enabled, Chrome may synchronize those settings as part of the browser's own sync infrastructure.

### Local onboarding state

After the user opens FloatPlay from its YouTube trigger or dismisses the first-use coachmark, FloatPlay stores one `true`/`false`-style seen state in local Chrome extension storage so the tip is not repeatedly shown. The stored flag does not include video identifiers, URLs, timestamps, analytics identifiers, or browsing history.

### What FloatPlay does not do

FloatPlay does not include a FloatPlay backend, authentication, third-party analytics, advertising SDKs, operational telemetry, or a FloatPlay watch-history service. The project does not sell user data or transmit YouTube viewing activity to FloatPlay infrastructure.

`docs/PRIVACY.md` is the canonical public privacy-policy text and includes the Chrome Web Store Limited Use disclosure.

## Store listing — English

### Summary

Enhance YouTube Picture-in-Picture with better playback controls.

### Detailed description

FloatPlay gives YouTube Picture-in-Picture a compact, media-first mini player with the playback controls you expect while keeping the extension lightweight and local-first.

Main features:

- Play and pause controls.
- Configurable backward and forward seeking, with 5-second defaults.
- Interactive playback timeline with elapsed or remaining time.
- Volume, mute, mouse-wheel volume adjustment, and configurable volume step.
- Playback speed presets from 0.25x to 2x while preserving externally selected higher rates.
- Keyboard shortcuts for playback, seeking, volume, mute, and speed.
- Automatic control hiding with configurable timing.
- Full Options Page with English and Brazilian Portuguese localization.
- First-use guidance that points users to the FloatPlay trigger without adding permanent visible text to YouTube.
- Continuity across supported YouTube SPA navigation and playlist progression when the browser/media lifecycle allows it.

FloatPlay is designed for Google Chrome Desktop 130 or later and supported YouTube watch pages. It does not block ads, download videos, or require a FloatPlay account. Current supported YouTube page and media state is processed locally only to provide FloatPlay features; FloatPlay does not retain, build, or transmit its own YouTube watch-history database.

## Store listing — Brazilian Portuguese

### Resumo

Melhore o Picture-in-Picture do YouTube com controles de reprodução mais completos.

### Descrição detalhada

O FloatPlay transforma o Picture-in-Picture do YouTube em um mini player compacto, focado no vídeo e com controles de reprodução mais completos, mantendo a extensão leve e com funcionamento local.

Principais recursos:

- Controles de reproduzir e pausar.
- Avanço e retrocesso configuráveis, com padrão de 5 segundos.
- Linha do tempo interativa com tempo decorrido ou restante.
- Volume, silenciar, ajuste pela roda do mouse e passo de volume configurável.
- Velocidades de reprodução de 0,25x a 2x, preservando velocidades externas maiores já ativas.
- Atalhos de teclado para reprodução, busca, volume, silenciar e velocidade.
- Ocultação automática dos controles com tempo configurável.
- Página completa de configurações em inglês e português do Brasil.
- Orientação de primeira utilização que indica onde encontrar o botão do FloatPlay sem adicionar texto permanente ao YouTube.
- Continuidade durante navegação SPA e avanço de playlists compatíveis quando o ciclo de vida do navegador e da mídia permitir.

O FloatPlay foi projetado para Google Chrome Desktop 130 ou superior e páginas compatíveis de vídeos do YouTube. Ele não bloqueia anúncios, não baixa vídeos e não exige uma conta FloatPlay. O estado atual da página e da mídia compatível do YouTube é processado localmente apenas para fornecer os recursos do FloatPlay; o FloatPlay não mantém, cria nem transmite seu próprio banco de histórico de vídeos assistidos no YouTube.

## Store asset inventory

### Already present in the extension package

- Branded extension icons at 16, 32, 48, and 128 pixels.
- The 128x128 store/installation icon uses the approved FloatPlay artwork with normalized transparent padding for Chrome Web Store visual weight.
- Localized extension name and short description in English and Brazilian Portuguese.

### Screenshot workflow

Generate a real 1280x800 English Options Page screenshot candidate from the built extension with:

```bash
pnpm capture:store-screenshot
```

The resulting file is written to `artifacts/web-store/options-page-en-1280x800.png`. The `artifacts/` directory is ignored by Git so the candidate can be reviewed before it is selected for upload. The capture uses the actual built Options Page in Playwright Chromium rather than a mock or generated product image.

A real YouTube/FloatPlay PiP screenshot remains a separate manual asset because live YouTube and Document Picture-in-Picture are intentionally outside the deterministic browser automation boundary.

### Remaining before submission

- Select the generated 1280x800 Options Page screenshot for upload, or capture an additional current real PiP/YouTube screenshot if it represents the core experience more clearly.
- Set final category, language/listing localization, distribution visibility, and regions in the developer dashboard.
- Complete the Privacy practices disclosure and Limited Use certification so they match `docs/PRIVACY.md` and the shipped behavior, including local YouTube media processing and the same-tab playback synchronization bridge.
- Run the final real Chrome/YouTube smoke-test matrix from `docs/TESTING.md` against the exact release candidate using Chrome 130 or later.
- Run `pnpm package:release` on the exact upload commit and inspect the resulting ZIP for the approved manifest/CSP/external-messaging policy and absence of source maps.

### Recommended / promotional assets

- Additional screenshots showing the PiP player and Options Page, up to the current store limit.
- Small promotional tile at 440x280.
- Marquee image at 1400x560 if FloatPlay should be eligible for marquee promotion.
- Locale-specific screenshots if separate English and Brazilian Portuguese visuals materially improve the listing.

Screenshots must show the actual current product experience and must not advertise unsupported behavior.

## Final dashboard review

Immediately before submission, verify that:

- the single-purpose statement matches the shipped extension;
- permission and site-access justifications match `manifest.json`;
- the Chrome 130 baseline, approved manifest allowlist, explicit CSP, and explicit closed external-messaging policy match the reviewed v1 security posture;
- privacy disclosures describe all data handling, including local media/page processing, Chrome storage sync, the device-local onboarding flag, and the same-tab playback synchronization bridge;
- the public privacy-policy URL works;
- the support URL works and public support guidance does not ask users to disclose private information;
- listing text and screenshots match the submitted version;
- no unsupported claims, rankings, badges, or comparative marketing have been added;
- the ZIP contains `manifest.json` at its root and contains no source maps or unexpected repository artifacts.
