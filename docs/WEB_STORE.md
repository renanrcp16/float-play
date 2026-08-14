# FloatPlay Chrome Web Store Draft

This document prepares Chrome Web Store metadata and reviewer-facing explanations from the currently implemented FloatPlay v1 behavior. Re-check the Chrome Web Store dashboard and policies immediately before submission because store requirements can change independently of this repository.

## Current package identity

- Name: FloatPlay
- Development version: `0.1.0`
- Manifest: Manifest V3
- Default locale: English
- Additional locale: Brazilian Portuguese
- Minimum Chrome version: 116
- Current explicit permission: `storage`
- Current content-script scope: `https://www.youtube.com/*` and `https://youtube.com/*`

Do not change the public release version to `1.0.0` until the v1 Definition of Done is complete.

## Single purpose

FloatPlay enhances YouTube Picture-in-Picture with a compact mini player and richer playback controls while keeping operation local-first and limited to supported YouTube watch experiences.

## Permission and site-access justification

### `storage`

FloatPlay uses Chrome extension storage to persist user preferences such as backward and forward seek intervals, volume adjustment step, automatic control hiding, auto-hide delay, and elapsed/remaining time display preference.

The implementation uses `chrome.storage.sync` when available so Chrome may synchronize these preferences through the user's Chrome account according to the user's browser settings. FloatPlay does not operate a backend that receives these preferences.

### YouTube content-script access

FloatPlay injects content scripts only on YouTube origins needed by the product. This access is required to:

- detect supported YouTube watch pages and the active `HTMLVideoElement`;
- open and manage the user-requested Document Picture-in-Picture session;
- move and safely restore the active media element;
- keep controls synchronized with media playback state;
- support YouTube SPA navigation and playlist progression;
- provide the FloatPlay trigger and the approved origin-surface playback interaction.

FloatPlay does not request access to unrelated websites.

## Data-handling draft

FloatPlay handles only data required to provide its disclosed single purpose.

### Transient media/page state

While the extension is active on YouTube, it reads media and page state needed for playback behavior, such as playback time, paused state, volume, mute state, playback rate, seekable ranges, active media identity, and supported-route/DOM context.

This state is processed inside the browser to provide the mini player and is not retained by FloatPlay as a watch-history database.

### Persisted preferences

User-selected FloatPlay settings are stored with Chrome extension storage. When Chrome sync is enabled, Chrome may synchronize those settings as part of the browser's own sync infrastructure.

### What FloatPlay does not do

FloatPlay does not include a FloatPlay backend, authentication, third-party analytics, advertising SDKs, operational telemetry, or a FloatPlay watch-history service. The project does not sell user data or transmit YouTube viewing activity to FloatPlay infrastructure.

Use `docs/PRIVACY.md` as the source text for the public privacy policy. Before store submission, publish that policy at a stable public URL and place that URL in the designated Chrome Web Store privacy field.

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
- Continuity across supported YouTube SPA navigation and playlist progression when the browser/media lifecycle allows it.

FloatPlay is designed for Google Chrome Desktop and supported YouTube watch pages. It does not block ads, download videos, collect watch history, or require a FloatPlay account.

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
- Continuidade durante navegação SPA e avanço de playlists compatíveis quando o ciclo de vida do navegador e da mídia permitir.

O FloatPlay foi projetado para Google Chrome Desktop e páginas compatíveis de vídeos do YouTube. Ele não bloqueia anúncios, não baixa vídeos, não coleta histórico de reprodução e não exige uma conta FloatPlay.

## Store asset inventory

### Already present in the extension package

- Branded extension icons at 16, 32, 48, and 128 pixels.
- Localized extension name and short description in English and Brazilian Portuguese.

### Required before submission

- Verify the 128x128 store icon against the current Chrome Web Store icon safe-area/padding guidance.
- At least one current product screenshot; prepare at 1280x800 when practical (640x400 is also supported by current guidance).
- A stable public privacy-policy URL based on `docs/PRIVACY.md`.
- A support URL or support destination appropriate for the public listing.
- Final category, language/listing localization, distribution visibility, and regions in the developer dashboard.

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
- privacy disclosures describe all data handling, including local processing and Chrome storage sync;
- the public privacy-policy URL works;
- listing text and screenshots match the submitted version;
- no unsupported claims, rankings, badges, or comparative marketing have been added;
- the ZIP contains `manifest.json` at its root.
