# FloatPlay Architecture

## Status

FloatPlay `v1.0.0` is publicly released. The current `main` development line is preparing `v1.1.0`, which adds configurable PiP-surface Play/Pause, persistent Audio-only mode, and supported YouTube Music playback. This document describes the current repository architecture and must stay synchronized with runtime changes.

## Goals

The architecture should keep FloatPlay:

- resilient to YouTube and YouTube Music SPA behavior;
- minimally coupled to private YouTube implementation details;
- local-first and explicit about data flow;
- easy to test without requiring live YouTube for every deterministic rule;
- explicit about lifecycle and cleanup;
- conservative about permissions and privileged extension contexts;
- small enough to remain understandable without unnecessary framework or service layers.

## Runtime model

FloatPlay uses four extension execution surfaces:

```text
Supported YouTube page
  │
  ├─ MAIN-world bridge (typed build entry)
  │     └─ narrow player synchronization for volume/mute/rate
  │        plus current-track seek on YouTube Music
  │
  └─ ISOLATED content script
        │
        └─ FloatPlayController
             ├─ YouTubeAdapter
             │    ├─ supported-surface detection
             │    ├─ trigger anchor detection
             │    ├─ active HTMLVideoElement selection
             │    ├─ YouTube Music current-track timeline mirroring
             │    └─ narrow same-page bridge messages
             ├─ DocumentPipManager
             │    └─ Document PiP session + safe media restoration/replacement
             ├─ FloatPlay trigger / first-use onboarding
             └─ PiP presentation components

Options Page
  └─ ChromeSettingsStore (chrome.storage.sync)

Service worker
  └─ opens the Options Page on validated extension messages

Content script onboarding
  └─ ChromeOnboardingStore (chrome.storage.local)
```

The active `HTMLVideoElement` remains the primary playback object. YouTube Music is the deliberate exception for the user-facing current-track timeline because its media element can expose cumulative timestamps that differ from the track timeline shown by the site.

## Architectural boundaries

### Application

Application code coordinates use cases and lifecycle. It may depend on narrow infrastructure contracts and presentation components, but it must not contain YouTube selector knowledge or direct global Chrome API usage.

Examples include:

- reconciling whether the current page is supported;
- deciding whether a usable media source exists;
- opening and ending a FloatPlay session;
- remounting presentation when YouTube Music changes the active media element;
- mounting presentation components for an active PiP session;
- applying deterministic playback rules;
- coordinating persisted user preferences and onboarding state through adapters.

Playback rules that do not require YouTube DOM knowledge belong in application helpers so they can be tested independently.

`MediaSeekableRange.ts` remains the single source of truth for validating media `seekable` ranges, locating the range that contains the current playback time, and applying FloatPlay's conservative live-edge guard. Standard YouTube seek buttons and the timeline reuse this shared safety contract.

### Infrastructure — YouTube

`YouTubeAdapter` owns YouTube-specific integration knowledge.

Its responsibilities include:

- classifying supported standard YouTube `/watch` pages and `music.youtube.com` surfaces;
- locating the preferred trigger anchor for each supported surface;
- finding the active connected `<video>`;
- ranking standard YouTube candidates by visible viewport area;
- restricting YouTube Music media discovery to the player media rather than unrelated page videos;
- reading the current-track YouTube Music timeline from the native player-bar state when media timestamps are cumulative;
- requesting current-track seeking through the narrow same-page bridge on YouTube Music;
- sending minimal same-page synchronization messages for volume, mute, and playback-rate compatibility.

The adapter should prefer platform-neutral media characteristics over private selectors and APIs whenever the platform state is trustworthy. YouTube-specific DOM or player methods are acceptable only for narrowly documented compatibility gaps such as YouTube Music's current-track timeline.

### MAIN-world YouTube player bridge

The MAIN-world bridge exists because YouTube maintains some player state and actions in its page context in addition to the `HTMLVideoElement` state exposed to the isolated extension content script.

The bridge is a typed source file under `src/infrastructure/youtube/` and is built into `youtube-player-main.js`. It is not an untracked public JavaScript artifact.

`YouTubePlayerBridgeProtocol.ts` is the single source of truth for the bridge channel, supported message shapes, outgoing normalization, and incoming parsing. Both the isolated-world adapter and the MAIN-world build entry compile against this same protocol module so their contract cannot drift independently.

The bridge:

- listens only for same-window, same-origin `window.postMessage` events;
- accepts only the `floatplay:youtube-player` channel;
- validates only the supported actions: volume, mute, playback rate, and seek-to;
- validates and clamps numeric values before use;
- invokes the corresponding YouTube player method only when that method exists;
- uses seek-to only for the user-requested current-track seek path required by YouTube Music;
- has no access to Chrome extension storage, privileged runtime APIs, FloatPlay settings, account identifiers, video identifiers, analytics identifiers, or backend services.

The bridge is compatibility synchronization, not a general page-control API. FloatPlay should continue using standard media APIs whenever they accurately represent the requested behavior.

### Infrastructure — Picture-in-Picture

`DocumentPipManager` owns:

- Document Picture-in-Picture capability detection;
- window creation;
- media movement into the PiP document;
- initial window geometry hints;
- PiP document baseline styling;
- safe restoration of the exact media node;
- replacement of the active media node inside an existing session when YouTube Music advances to a new player media element;
- session lifecycle and cleanup;
- the minimal session context needed by presentation components.

It must not own YouTube navigation logic, trigger placement, settings, or presentation behavior.

FloatPlay declares Chrome 130 as its minimum supported browser version because the reviewed window-creation contract uses both `disallowReturnToOpener` and `preferInitialWindowPlacement`.

### Infrastructure — Chrome

Chrome-specific adapters remain narrow and capability-focused.

Current responsibilities include:

- localized extension messages through `ChromeI18n`;
- settings persistence through `chrome.storage.sync`;
- device-local onboarding persistence through `chrome.storage.local`;
- extension resource URL resolution;
- validated messaging used to open the Options Page.

The Manifest V3 service worker exists only to receive the validated open-options request and call `chrome.runtime.openOptionsPage()`.

The manifest explicitly closes Chrome's external extension/page messaging surface with `externally_connectable.ids` set to an empty list and no web-page match patterns. Internal extension messaging remains available to FloatPlay's own contexts; relaxing the external policy requires a fresh security review.

### Presentation

Presentation owns visible controls, layout, focus behavior, menus, and user interaction surfaces.

Current presentation responsibilities include:

- the YouTube/YouTube Music entry trigger and first-use coachmark;
- `PlayerShell` inside the Document PiP window;
- timeline and time-display controls;
- volume controls;
- keyboard shortcuts;
- overflow actions such as speed, fit, settings, and Audio-only mode where allowed;
- mandatory Audio-only presentation on YouTube Music;
- automatic control visibility;
- `OriginPlaybackSurface` for the eligible non-interactive area at the original standard YouTube player location;
- optional `PipPlaybackSurface` behavior when the user enables click-on-video Play/Pause.

The PiP video surface remains passive by default. When the persisted `pipVideoClickTogglesPlayback` preference is enabled, only the video image becomes a click target and receives the corresponding visual hover feedback; overlaid controls remain independent interactive elements.

In Audio-only mode the video image is hidden, the player uses compact geometry, and playback controls remain visible. On standard YouTube, Audio-only is user-selectable and persisted. On YouTube Music it is required and the restore-video action is not exposed.

### Settings and onboarding

User-facing player preferences use a versioned settings schema and `chrome.storage.sync`.

Current synchronized preferences include seek intervals, volume step, auto-hide behavior, time display mode, PiP video-surface click behavior, and the persisted standard-YouTube Audio-only choice.

The first-use trigger coachmark uses one device-local boolean in `chrome.storage.local`. It is separate from synchronized player preferences and contains no URL, video, timestamp, history, or analytics information.

## Source-of-truth rules

The active `HTMLVideoElement` is authoritative for:

- paused/playing state;
- volume;
- muted state;
- playback rate;
- standard YouTube media time and seekable ranges.

For YouTube Music, FloatPlay deliberately mirrors the current-track elapsed time and duration from the native player-bar state because the underlying media element may expose timestamps accumulated across tracks. User-requested timeline seeking is sent as a relative current-track target to YouTube's player through the narrow bridge rather than by applying that relative value directly to the cumulative media timestamp.

FloatPlay controls should otherwise mutate or read platform media state first and reflect media events instead of maintaining a competing playback model.

## State categories

FloatPlay distinguishes three categories of runtime state:

### Media state

Owned primarily by the active media element, with the documented YouTube Music current-track timeline exception.

### Application state

Examples include whether a PiP session is active, which media node the session currently owns, whether the trigger is actionable, and whether first-use onboarding remains pending for the current extension profile.

### Presentation state

Examples include whether controls are visible, whether Audio-only is active, whether an overflow disclosure is open, or whether the coachmark is currently rendered.

These categories may interact but should not be collapsed into one global mutable object.

## YouTube SPA strategy

YouTube and YouTube Music are single-page applications. FloatPlay cannot assume a full document reload between videos or tracks.

The current strategy is:

1. observe relevant DOM mutations;
2. coalesce mutation bursts through `requestAnimationFrame`;
3. reconcile current surface, trigger anchor, media availability, and PiP state;
4. keep one trigger instance and reattach it when the preferred anchor is recreated;
5. on YouTube Music, follow a new active player media element only after the currently owned media is no longer the active playing element;
6. avoid continuous high-frequency polling and avoid depending exclusively on private navigation events.

## Active-media selection

Multiple `<video>` elements may exist in a supported page DOM.

On standard YouTube, FloatPlay rejects hidden/non-visible candidates and ranks remaining media by actual viewport intersection. This reduces the risk of selecting a large preloaded or off-screen video without depending on a private video class.

On YouTube Music, media discovery is deliberately narrower: candidates come from the YouTube Music/player media area rather than arbitrary page videos, and a currently playing ready element is preferred. This avoids following unrelated or preloaded media during track transitions.

## Cleanup rule

Any component that creates a listener, observer, animation frame, timer, subscription, or separate window must own an explicit cleanup path.

Cleanup should be idempotent where practical. PiP presentation components are tied to the active presentation/session abort signals, and document-level controller resources are tied to the controller lifecycle signal.

## PiP restoration strategy

Before moving a media element, FloatPlay records its logical DOM position with a placeholder and original parent relationship.

When the PiP window closes:

1. prefer replacing the still-connected placeholder with the media node;
2. if the placeholder is gone but the original parent remains valid, restore relative to the recorded sibling when possible;
3. do not insert the media node into an arbitrary fallback container merely to keep it connected;
4. surface a structured failure for investigation if no safe restoration target remains.

When YouTube Music replaces the active player media during an open PiP session, FloatPlay creates a new origin record for the replacement, moves it into the existing PiP document, and restores the previous media through the same safe restoration strategy.

## Styling isolation

Visible FloatPlay UI injected into YouTube uses an isolated Shadow DOM boundary for the trigger so site CSS does not accidentally style it and FloatPlay styles do not leak into the site.

The PiP player shell lives in its own Document PiP document and therefore has a separate document styling scope.

## Privilege model

FloatPlay intentionally uses a small privilege surface:

- Manifest V3;
- Chrome 130 minimum;
- one explicit Chrome permission: `storage`;
- content scripts limited to `https://www.youtube.com/*`, `https://youtube.com/*`, and `https://music.youtube.com/*`;
- one narrow service worker operation for opening the Options Page;
- one MAIN-world bridge limited to local supported YouTube player synchronization;
- one web-accessible resource, `brand/icon.svg`, limited to the approved YouTube origins;
- an explicit extension-page Content Security Policy of `default-src 'self'`;
- an explicit `externally_connectable` policy with no allowed extension IDs and no allowed web-page matches;
- no broad host permissions, optional permissions, sandbox pages, FloatPlay backend, remote executable code, analytics, telemetry, authentication, or unrelated host access.

The source and built manifests are required to match exactly. Release verification treats the reviewed manifest keys, content-script definitions, execution worlds, `run_at` values, background worker, CSP, external-messaging policy, icon set, and web-accessible resources as an explicit allowlist.

Any new manifest key, permission, host, external connection allowance, remote code path, backend dependency, additional web-accessible resource, sandbox, or expanded MAIN-world responsibility requires a fresh architecture/security review before the release allowlist is changed.

## Release artifact boundary

`dist/` is the complete production extension tree and is the only input to the Chrome Web Store ZIP.

The release process enforces the following boundaries:

- JavaScript build entries are generated from tracked TypeScript sources through Vite;
- production source maps are disabled and `.map` files are rejected by both release verification and packaging;
- `pnpm verify:release` rebuilds `dist/`, validates the manifest security allowlist, checks referenced assets/locales, and rejects forbidden artifacts;
- `pnpm package:release` runs verification first, then creates a deterministic archive containing exactly the regular files present in the verified `dist/` tree;
- the ZIP places `manifest.json` at its root and rejects unsafe archive paths or source-map entries.

The release package must not silently acquire repository source files, tests, dependency trees, or other non-extension artifacts.

## Dependency rule

Runtime behavior is implemented with browser/platform APIs and native DOM APIs; the extension currently has no runtime package dependency.

The development toolchain uses Vite, TypeScript, ESLint with typescript-eslint, Vitest, and an isolated Playwright package for browser E2E.

A presentation framework should be introduced only if future complexity creates a concrete maintainability benefit that outweighs the additional runtime and architectural cost.

## Testing strategy

Testing is layered:

- unit tests for deterministic calculations, normalization, protocol parsing, policies, and playback rules;
- browser E2E for extension-owned deterministic surfaces;
- targeted real Chrome/YouTube smoke tests for live site DOM, MAIN-world synchronization, Document PiP lifecycle, YouTube Music track transitions, and other browser/site-owned behavior.

Synthetic tests must not be presented as proof of live YouTube compatibility. Conversely, deterministic regressions should not rely only on manual smoke testing when a stable automated test is practical.

## Future architectural decisions

Decisions with long-term structural impact should be recorded as short Architecture Decision Records under `docs/decisions/` when a dedicated ADR provides more value than keeping this canonical architecture document synchronized.
