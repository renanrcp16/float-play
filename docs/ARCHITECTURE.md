# FloatPlay Architecture

## Status

FloatPlay is in final v1 release hardening. The core Document Picture-in-Picture integration and production player behavior have been validated against real Chrome and YouTube. This document describes the current production architecture and must stay synchronized with runtime changes.

## Goals

The architecture should keep FloatPlay:

- resilient to YouTube SPA navigation;
- minimally coupled to private YouTube implementation details;
- local-first and explicit about data flow;
- easy to test without requiring live YouTube for every deterministic rule;
- explicit about lifecycle and cleanup;
- conservative about permissions and privileged extension contexts;
- small enough to remain understandable without unnecessary framework or service layers.

## Runtime model

FloatPlay currently uses four extension execution surfaces:

```text
YouTube page
  │
  ├─ MAIN-world bridge (typed build entry)
  │     └─ optional YouTube player synchronization for volume/mute/rate
  │
  └─ ISOLATED content script
        │
        └─ FloatPlayController
             ├─ YouTubeAdapter
             │    ├─ supported-route detection
             │    ├─ trigger anchor detection
             │    ├─ active HTMLVideoElement selection
             │    └─ narrow same-page bridge messages
             ├─ DocumentPipManager
             │    └─ Document PiP session + safe media restoration
             ├─ FloatPlay trigger / first-use onboarding
             └─ PiP presentation components

Options Page
  └─ ChromeSettingsStore (chrome.storage.sync)

Service worker
  └─ opens the Options Page on validated extension messages

Content script onboarding
  └─ ChromeOnboardingStore (chrome.storage.local)
```

The active `HTMLVideoElement` is the playback source of truth.

## Architectural boundaries

### Application

Application code coordinates use cases and lifecycle. It may depend on narrow infrastructure contracts and presentation components, but it must not contain YouTube selector knowledge or direct global Chrome API usage.

Examples include:

- reconciling whether the current page is supported;
- deciding whether a usable media source exists;
- opening and ending a FloatPlay session;
- mounting presentation components for an active PiP session;
- applying deterministic playback rules;
- coordinating persisted user preferences and onboarding state through adapters.

Playback rules that do not require YouTube DOM knowledge belong in application helpers so they can be tested independently.

### Infrastructure — YouTube

`YouTubeAdapter` owns YouTube-specific integration knowledge.

Its responsibilities include:

- validating the exact supported YouTube host and `/watch` route;
- locating the preferred trigger anchor in the watch metadata/channel action area;
- falling back safely when that anchor is unavailable;
- finding the active connected `<video>` using platform-neutral media geometry;
- ranking candidate videos by their area actually visible inside the current viewport rather than raw element dimensions;
- sending a minimal same-page synchronization message for volume, mute, and playback-rate compatibility.

The adapter should prefer platform-neutral media characteristics over private YouTube selectors and APIs whenever possible.

### MAIN-world YouTube player bridge

The MAIN-world bridge exists only because YouTube maintains player state in its page context in addition to the `HTMLVideoElement` state exposed to the isolated extension content script.

The bridge is a typed source file under `src/infrastructure/youtube/` and is built into `youtube-player-main.js`. It is not an untracked public JavaScript artifact.

The bridge:

- listens only for same-window, same-origin `window.postMessage` events;
- accepts only the `floatplay:youtube-player` channel;
- validates exactly three actions: volume, mute, and playback rate;
- validates and clamps numeric values before use;
- invokes the corresponding YouTube player method only when that method exists;
- has no access to Chrome extension storage, privileged runtime APIs, FloatPlay settings, account identifiers, video identifiers, analytics identifiers, or backend services.

The bridge is compatibility synchronization, not the primary media behavior path. FloatPlay applies supported state changes to the active `HTMLVideoElement` first. If a private YouTube synchronization method disappears, the extension should preserve native media behavior wherever the platform API still supports it.

### Infrastructure — Picture-in-Picture

`DocumentPipManager` owns:

- Document Picture-in-Picture capability detection;
- window creation;
- media movement into the PiP document;
- initial window geometry hints;
- PiP document baseline styling;
- safe restoration of the exact media node;
- session lifecycle and cleanup;
- the minimal session context needed by presentation components.

It must not own YouTube navigation logic, trigger placement, settings, or presentation behavior.

### Infrastructure — Chrome

Chrome-specific adapters remain narrow and capability-focused.

Current responsibilities include:

- localized extension messages through `ChromeI18n`;
- settings persistence through `chrome.storage.sync`;
- device-local onboarding persistence through `chrome.storage.local`;
- extension resource URL resolution;
- validated messaging used to open the Options Page.

The Manifest V3 service worker exists only to receive the validated open-options request and call `chrome.runtime.openOptionsPage()`.

### Presentation

Presentation owns visible controls, layout, focus behavior, menus, and user interaction surfaces.

Current presentation responsibilities include:

- the YouTube entry trigger and first-use coachmark;
- `PlayerShell` inside the Document PiP window;
- timeline and time-display controls;
- volume controls;
- keyboard shortcuts;
- overflow actions such as speed, fit, and settings;
- automatic control visibility;
- `OriginPlaybackSurface` for the eligible non-interactive area at the original YouTube player location.

The PiP video image itself is passive. Play/Pause inside PiP requires the explicit playback control or supported keyboard shortcut.

The origin interaction layer resolves the current origin-container geometry at click time and fails closed when the container is disconnected or no longer has trustworthy visible geometry. It must not intentionally intercept native YouTube controls or reuse stale opening-time coordinates.

### Settings and onboarding

User-facing player preferences use a versioned settings schema and `chrome.storage.sync`.

The first-use trigger coachmark uses one device-local boolean in `chrome.storage.local`. It is separate from synchronized player preferences and contains no URL, video, timestamp, history, or analytics information.

## Source-of-truth rules

The active `HTMLVideoElement` is authoritative for:

- paused/playing state;
- current time;
- duration and seekable ranges;
- volume;
- muted state;
- playback rate.

FloatPlay controls should mutate or read this platform media state first and reflect media events instead of maintaining a competing playback model.

The narrow YouTube MAIN-world bridge may mirror selected state changes into YouTube's own player implementation, but it must not become the authoritative playback state.

## State categories

FloatPlay distinguishes three categories of runtime state:

### Media state

Owned by the active media element.

### Application state

Examples include whether a PiP session is active, whether the trigger is actionable, and whether first-use onboarding remains pending for the current extension profile.

### Presentation state

Examples include whether controls are visible, an overflow disclosure is open, or the coachmark is currently rendered.

These categories may interact but should not be collapsed into one global mutable object.

## YouTube SPA strategy

YouTube is a single-page application. FloatPlay cannot assume a full document reload between videos.

The current strategy is:

1. observe relevant DOM mutations;
2. coalesce mutation bursts through `requestAnimationFrame`;
3. reconcile current route, trigger anchor, media availability, and PiP state;
4. keep one trigger instance and reattach it when the preferred anchor is recreated;
5. avoid continuous high-frequency polling and avoid depending exclusively on private YouTube navigation events.

## Active-media selection

Multiple `<video>` elements may exist in the page DOM. FloatPlay does not select a candidate solely because it has the largest raw rectangle.

For each connected candidate it:

1. rejects zero-sized, `display:none`, hidden/collapsed, or fully transparent media;
2. intersects the media rectangle with the current viewport;
3. rejects candidates with zero visible viewport area;
4. selects the candidate with the largest actual viewport intersection.

This reduces the risk of choosing a large preloaded or off-screen video while keeping the algorithm independent of private YouTube video classes.

## Cleanup rule

Any component that creates a listener, observer, animation frame, timer, subscription, or separate window must own an explicit cleanup path.

Cleanup should be idempotent where practical. PiP presentation components are tied to the active session abort signal, and document-level controller resources are tied to the controller lifecycle signal.

## PiP restoration strategy

Before moving a media element, FloatPlay records its logical DOM position with a placeholder and original parent relationship.

When the PiP window closes:

1. prefer replacing the still-connected placeholder with the media node;
2. if the placeholder is gone but the original parent remains valid, restore relative to the recorded sibling when possible;
3. do not insert the media node into an arbitrary fallback container merely to keep it connected;
4. surface a structured failure for investigation if no safe restoration target remains.

## Styling isolation

Visible FloatPlay UI injected into YouTube uses an isolated Shadow DOM boundary for the trigger so YouTube CSS does not accidentally style it and FloatPlay styles do not leak into YouTube.

The PiP player shell lives in its own Document PiP document and therefore has a separate document styling scope.

## Privilege model

FloatPlay intentionally uses a small privilege surface:

- Manifest V3;
- one explicit Chrome permission: `storage`;
- content scripts limited to `https://www.youtube.com/*` and `https://youtube.com/*`;
- one narrow service worker operation for opening the Options Page;
- one MAIN-world bridge limited to local YouTube player synchronization;
- one web-accessible resource, `brand/icon.svg`, limited to the approved YouTube origins;
- an explicit extension-page Content Security Policy of `default-src 'self'`;
- no host permissions, optional permissions, externally connectable surface, sandbox pages, FloatPlay backend, remote executable code, analytics, telemetry, authentication, or unrelated host access.

The source and built manifests are required to match exactly. Release verification also treats the current manifest keys, content-script definitions, execution worlds, `run_at` values, background worker, CSP, icon set, and web-accessible resources as an explicit v1 allowlist.

Any new manifest key, permission, host, externally connectable surface, remote code path, backend dependency, additional web-accessible resource, sandbox, or expanded MAIN-world responsibility requires a fresh architecture/security review before the release allowlist is changed.

## Release artifact boundary

`dist/` is the complete production extension tree and is the only input to the Chrome Web Store ZIP.

The release process enforces the following boundaries:

- all four JavaScript build entries are generated from tracked TypeScript sources through Vite;
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

- unit tests for deterministic calculations, normalization, and playback rules;
- browser E2E for extension-owned deterministic surfaces;
- real Chrome/YouTube smoke tests for live YouTube DOM, MAIN-world synchronization, Document PiP lifecycle, SPA navigation, playlists, live streams, and other browser-owned behavior.

Synthetic tests must not be presented as proof of live YouTube compatibility. Conversely, deterministic regressions should not rely only on manual smoke testing when a stable automated test is practical.

## Future architectural decisions

Decisions with long-term structural impact should be recorded as short Architecture Decision Records under `docs/decisions/` when a dedicated ADR provides more value than keeping the current canonical architecture document synchronized.
