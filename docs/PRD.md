# FloatPlay Product Requirements Document

## Document status

- Product: FloatPlay
- Target release: v1.0.0
- Status: Approved product scope; core technical feasibility validated by Spike 0
- Primary platform: Google Chrome Desktop
- Primary website: YouTube

## 1. Product vision

FloatPlay improves YouTube Picture-in-Picture by providing a compact, always-on-top video experience with better playback controls while remaining lightweight, private, accessible, and resilient to changes in YouTube's internal implementation.

The product must prefer robustness over feature count. Features that require fragile coupling to private YouTube APIs or unstable DOM internals are excluded unless a stable implementation can be demonstrated.

## 2. Product purpose

FloatPlay has one primary purpose:

> Enhance the Picture-in-Picture experience for YouTube videos with a custom mini player and improved playback controls.

FloatPlay is not intended to become a general-purpose YouTube modification suite.

## 3. Supported environment

### 3.1 Browser

The v1 release officially supports Google Chrome Desktop only.

Other Chromium browsers may work but are not part of the v1 compatibility promise.

### 3.2 YouTube surfaces

The v1 release officially supports:

- Standard `youtube.com/watch` video pages.
- Videos opened from playlists.
- Live streams when the active media element exposes compatible seekable media behavior.

The v1 release does not officially support:

- YouTube Shorts.
- YouTube Music.
- Embedded YouTube players on third-party websites.
- Mobile Chrome.

## 4. Entry point

### FR-001 — YouTube trigger

FloatPlay must expose a discreet control on supported YouTube watch pages when a compatible video element is available.

The control must not visually pollute the page or require modification of YouTube's native control bar.

### FR-002 — Explicit user activation

Opening the mini player must originate from an explicit user gesture so that Document Picture-in-Picture can be requested without bypassing browser activation requirements.

### FR-003 — Unsupported state

The FloatPlay trigger must not be shown as an actionable control when no compatible video is available.

## 5. Picture-in-Picture window

### FR-004 — Document Picture-in-Picture

FloatPlay must use Document Picture-in-Picture as the primary v1 window technology.

### FR-005 — Initial size

FloatPlay must calculate the initial Picture-in-Picture geometry from the active media's intrinsic aspect ratio when reliable dimensions are available.

The initial target uses approximately 480 pixels on the media's longer dimension. A 16:9 fallback may be used when reliable media dimensions are unavailable.

When a new PiP session is opened, FloatPlay should ask Chrome to prefer the freshly calculated initial geometry instead of reusing a previous manual resize. Browser and operating-system window-management constraints remain authoritative.

### FR-006 — Resizing

The user must be able to resize the Picture-in-Picture window. The player interface must adapt to the available space.

### FR-007 — Video-first layout

The video must occupy as much of the available window area as practical.

### FR-008 — Overlay controls

Player controls should be presented as an overlay over the video rather than permanently consuming a separate large control area.

### FR-009 — Auto-hide

Controls must automatically hide during playback after a configurable period of inactivity.

### FR-010 — Paused visibility

Controls must remain visible while the video is paused.

### FR-011 — Responsive overflow

When the window becomes too small to show all controls safely, secondary actions must move into an overflow menu instead of being compressed into unusable targets.

## 6. Playback controls

### FR-012 — Play and pause

The mini player must expose an explicit Play/Pause control.

Pointer clicks on the PiP video image itself must not toggle playback. The video image is a passive media surface; pointer-driven Play/Pause inside the PiP window is performed through the explicit control.

While PiP is active, FloatPlay must preserve predictable Play/Pause interaction on the non-interactive central area left at the original YouTube player location for both standard videos and live streams. That origin interaction must not intentionally intercept YouTube's native buttons, sliders, links, form controls, or other semantically interactive elements.

The `HTMLVideoElement` is the source of truth for playback state. FloatPlay must reflect media events instead of maintaining an independent competing playback state.

### FR-013 — Seek backward

The mini player must expose a backward seek action.

The default seek interval is 10 seconds.

### FR-014 — Seek forward

The mini player must expose a forward seek action.

The default seek interval is 10 seconds.

### FR-015 — Configurable seek values

Backward and forward seek intervals must be independently configurable from the Options Page.

### FR-016 — Interactive timeline

The player must provide an interactive timeline that allows click and drag seeking when the media supports it.

### FR-017 — Playback time display

The player must display the current playback time.

### FR-018 — Remaining time mode

The duration indicator must be clickable and switch between elapsed-duration presentation and remaining-time presentation, following the interaction pattern used by YouTube.

The selected display mode should be persisted as a user preference.

### FR-019 — Live media

Timeline behavior for live streams must use the media's actual seekable ranges rather than assuming a fixed `0..duration` range.

FloatPlay must treat the exact end of a live seekable range conservatively and must not assume that `seekable.end()` is always semantically equivalent to YouTube's stable live edge.

## 7. Volume

### FR-020 — Volume control

The mini player must expose a volume control synchronized with the active media element.

### FR-021 — Mute

The player must expose Mute and Unmute without destroying the user's previous volume value.

### FR-022 — Preserve current volume

Opening FloatPlay must preserve the volume and muted state already active in YouTube.

### FR-023 — Mouse wheel volume

Mouse wheel volume changes may be handled only while the pointer is over the volume control's interactive area, including the speaker button and volume slider.

FloatPlay must not capture wheel events over the rest of the player for this behavior.

## 8. Playback speed

### FR-024 — Playback speed selector

The v1 player must provide selectable playback speed presets from 0.25× through 2×.

### FR-025 — Preserve external playback speed

Opening FloatPlay must preserve the playback speed already active in YouTube, including values greater than 2×.

If a video is already playing at 4×, FloatPlay must continue to represent and preserve 4× as the current state.

### FR-026 — External speed representation

A current playback speed greater than 2× may be represented by the FloatPlay UI as the current external value without becoming a selectable v1 preset.

If the user selects a FloatPlay preset at or below 2×, the v1 UI is not required to provide a way to return to the previous external value greater than 2×.

### FR-027 — No entitlement inference

FloatPlay must not attempt to infer YouTube Premium entitlement through private APIs, fragile scraping, or feature bypasses.

## 9. Keyboard interaction

### FR-028 — Keyboard scope

Keyboard shortcuts apply while the Picture-in-Picture window has focus and must not indiscriminately intercept events from incompatible interactive elements.

### FR-029 — Play/Pause shortcut

`Space` controls Play/Pause.

### FR-030 — Seek shortcuts

Left and Right Arrow control backward and forward seek.

Shift-modified seek may provide a larger seek interval when implemented consistently with the final control model.

### FR-031 — Volume shortcuts

Up and Down Arrow adjust volume.

### FR-032 — Mute shortcut

`M` toggles mute.

### FR-033 — Playback speed shortcuts

`[` and `]` select the previous and next FloatPlay playback speed presets.

### FR-034 — Shortcut customization

Custom shortcut remapping is out of scope for v1.

## 10. YouTube navigation behavior

### FR-035 — SPA navigation continuity

When the user navigates from one supported YouTube video to another within the same document, the existing FloatPlay window should remain open and rebind to the newly active media element when this can be done safely.

### FR-036 — Playlist continuity

Automatic transition to the next video in a YouTube playlist should continue in the existing FloatPlay window when technically safe.

### FR-037 — Leaving supported pages

When the user leaves the supported YouTube watch surface and a safe media rebind is not available, FloatPlay must end the current mini-player session cleanly.

### FR-038 — Full document reload

FloatPlay does not promise Picture-in-Picture continuity across a full reload or destruction of the originating document. This is a browser platform limitation.

## 11. Media restoration

### FR-039 — Original DOM restoration

When the FloatPlay window closes, the media element must be restored to its original logical DOM position when that position still exists.

### FR-040 — Safe failure

If the original restoration target no longer exists, FloatPlay must prefer a safe, recoverable termination path over inserting the media element into an arbitrary DOM location.

## 12. Advertising and third-party extensions

### FR-041 — Advertising neutrality

FloatPlay must not block, remove, or automatically skip YouTube advertising.

### FR-042 — Native ad controls

FloatPlay v1 does not replicate or programmatically invoke YouTube's native "Skip ad" control.

### FR-043 — Ad blockers

FloatPlay does not detect or interfere with third-party ad blockers. It operates on the media and DOM state that remains after other extensions have performed their own changes.

Compatibility with every third-party extension cannot be guaranteed.

## 13. Options Page

### FR-044 — Full-page settings

FloatPlay must provide a full Options Page that opens in a normal browser tab.

### FR-045 — Seek settings

The Options Page must allow independent configuration of backward and forward seek durations.

### FR-046 — Volume step

The Options Page must allow configuration of the volume adjustment step.

### FR-047 — Auto-hide behavior

The Options Page must allow the user to enable or disable automatic control hiding.

### FR-048 — Auto-hide delay

The Options Page must allow the user to configure the delay before controls hide.

### FR-049 — Shortcut reference

The Options Page must document the active keyboard shortcuts.

### FR-050 — Settings access

The mini-player overflow menu must provide a direct path to open the full Options Page.

## 14. Settings persistence

### FR-051 — Chrome storage

Small user preferences should use Chrome extension storage rather than custom cookies, browser history, or a backend service.

### FR-052 — Settings schema version

Persisted settings must include an explicit schema version so future releases can migrate data intentionally.

### FR-053 — Synchronization

Preferences appropriate for cross-device synchronization should use `chrome.storage.sync` when available and within Chrome storage constraints.

## 15. Internationalization

### FR-054 — Supported locales

The v1 release supports English and Brazilian Portuguese.

### FR-055 — Locale behavior

Browser locale resolution must behave as follows:

- `pt-BR` uses Brazilian Portuguese.
- English browser locales use English.
- Unsupported browser locales fall back to English.

### FR-056 — Default locale

English is the extension default locale.

### FR-057 — Manual language selector

A manual language selector is out of scope for v1.

### FR-058 — Repository language

Source code, code identifiers, comments, commit messages, pull requests, issues, and repository-facing technical documentation must be written in English.

User-facing localized resources are the explicit exception.

## 16. Visual design

### NFR-001 — Visual direction

The player should be modern, minimal, and media-first.

### NFR-002 — Player color treatment

The player does not expose configurable light and dark themes in v1. Controls use a consistent high-contrast overlay treatment suitable for changing video content.

### NFR-003 — Options Page color scheme

The Options Page should automatically follow the user's light or dark system/browser color preference through platform color-scheme capabilities.

A manual theme selector is out of scope for v1.

## 17. Accessibility

### NFR-004 — Keyboard accessibility

All interactive player and Options Page functionality must be operable by keyboard.

### NFR-005 — Semantic controls

Native semantic elements must be preferred for interactive controls.

### NFR-006 — Accessible names

Icon-only controls must expose meaningful accessible names.

### NFR-007 — Focus visibility

Keyboard focus must remain visibly identifiable.

### NFR-008 — Contrast

Color contrast must meet the project's release accessibility criteria.

### NFR-009 — Reduced motion

Animations and transitions must respect `prefers-reduced-motion`.

## 18. Privacy

### NFR-010 — Local-first operation

FloatPlay v1 must operate without a FloatPlay backend.

### NFR-011 — No authentication

FloatPlay v1 must not require a user account or login.

### NFR-012 — No analytics

FloatPlay v1 must not include third-party analytics.

### NFR-013 — No telemetry

FloatPlay v1 must not transmit operational telemetry to FloatPlay infrastructure.

### NFR-014 — No watch history collection

FloatPlay must not collect or persist the user's YouTube watch history.

## 19. Security

### NFR-015 — Manifest V3

FloatPlay must use Chrome Extension Manifest V3.

### NFR-016 — Minimum permissions

The extension must request only permissions required by implemented functionality.

Permissions must not be requested speculatively for possible future features.

### NFR-017 — Host scope

Host access must be limited to the YouTube origins required by supported functionality.

### NFR-018 — No remotely hosted executable code

All executable extension code must ship inside the extension package. Runtime-loaded remote scripts and equivalent remote executable code are prohibited.

### NFR-019 — No dynamic code execution

`eval`, `new Function`, and equivalent dynamic-code patterns are prohibited.

### NFR-020 — Untrusted page boundary

Data originating from the host page must be treated as untrusted whenever it crosses into privileged extension contexts.

### NFR-021 — Dependency discipline

Every runtime and development dependency must have a clear technical purpose. Native platform APIs are preferred when they solve the problem clearly and safely.

## 20. Architecture and maintainability

### NFR-022 — YouTube isolation

YouTube-specific DOM knowledge must remain isolated behind dedicated infrastructure code.

### NFR-023 — Media source of truth

The active `HTMLVideoElement` is the source of truth for playback time, paused state, volume, mute, and playback rate.

### NFR-024 — State separation

Media state, application lifecycle state, and transient presentation state must not be conflated into one undifferentiated state object.

### NFR-025 — Explicit cleanup

Every listener, observer, timer, animation frame, and subscription introduced by FloatPlay must have an explicit cleanup path.

### NFR-026 — Event-driven observation

Continuous high-frequency polling must not be used to track YouTube changes.

### NFR-027 — Reconciliation

YouTube SPA integration should use event/DOM-driven reconciliation that inspects current reality instead of relying exclusively on private YouTube navigation events.

### NFR-028 — TypeScript strictness

Production TypeScript must compile with `strict` enabled. Avoid `any` as an error-suppression technique.

## 21. Quality gates

### NFR-029 — Lint

Lint must pass before production changes are merged.

### NFR-030 — Typecheck

TypeScript type checking must pass before production changes are merged.

### NFR-031 — Automated tests

Behavioral rules with meaningful isolated logic must be covered by unit tests.

Integration tests must cover communication between player controls and media behavior as those controls are implemented.

### NFR-032 — End-to-end coverage

Critical extension flows must gain browser-level end-to-end coverage before v1.0.0.

### NFR-033 — Real YouTube smoke tests

The release process must include a manual smoke-test matrix against the real YouTube website because FloatPlay integrates with a third-party application that may change independently.

### NFR-034 — Production build

A production build must succeed before a release is considered valid.

## 22. Development workflow

### NFR-035 — Versioning

FloatPlay uses Semantic Versioning.

Development releases remain below `1.0.0` until the v1 Definition of Done is satisfied.

### NFR-036 — Git workflow

Changes are developed on short-lived branches and merged through pull requests.

Feature branches should be removed after merge.

### NFR-037 — Commit convention

Repository commits use Conventional Commits.

### NFR-038 — Main branch quality

`main` should remain in a buildable and reviewed state.

## 23. Explicit v1 exclusions

The following capabilities are not part of the v1 scope:

- YouTube Shorts support.
- YouTube Music support.
- Third-party embedded YouTube player support.
- Firefox, Safari, and official Edge support.
- Video downloads.
- Ad blocking.
- Automatic ad skipping.
- Sponsor-blocking features.
- Custom subtitles or transcript tools.
- Custom playlists or queue management.
- Likes, dislikes, comments, and channel actions.
- YouTube Data API integration.
- Custom keyboard remapping.
- Configurable visual themes for the player.
- User accounts.
- Custom backend services.
- Analytics or telemetry.
- Cross-device watch history.
- Screenshots.
- Sleep timers.
- Casting.
- Remote control features.

## 24. Spike 0 — completed technical feasibility gate

Spike 0 validated the core integration assumptions required before production player UI development.

The spike covered:

1. Detecting the active YouTube `HTMLVideoElement` without relying on fragile internal player classes.
2. Opening Document Picture-in-Picture from a valid user gesture.
3. Moving the active media element into the Picture-in-Picture document.
4. Preserving playback while the media element changes document ownership.
5. Restoring the media element to its original logical DOM location when the PiP window closes.
6. Navigating from video A to video B with PiP open.
7. Automatic playlist progression with PiP open.
8. Live-stream behavior and seekable ranges.
9. Advertising transitions.
10. Safe cleanup when the originating page changes unexpectedly.

The gate completed successfully on real Chrome and YouTube on Windows on 2026-08-13. The validated architecture keeps the YouTube-owned media element as the shared source of truth, safely restores it on session end, and remains stable across the tested navigation, playlist, live, advertising, unsupported-route, and reload scenarios.

The live-stream investigation also established that the exact reported end of a seekable range may briefly expose YouTube end-of-media presentation before the player returns to the live edge. Future live controls must preserve the conservative behavior defined by FR-019.

If future regressions demonstrate that moving YouTube's media element has become structurally unreliable, production UI development must stop until the architecture is revised. The project must not compensate for a flawed foundation with increasingly fragile DOM patches.

## 25. v1 Definition of Done

FloatPlay v1.0.0 is ready only when:

- All approved v1 functional requirements are implemented.
- The supported YouTube scenarios pass the release smoke-test matrix.
- SPA navigation and playlist progression are stable within documented browser limitations.
- Media restoration is safe and repeatable.
- Keyboard navigation and accessible names are complete.
- Reduced-motion behavior is respected.
- English and Brazilian Portuguese localization are complete.
- Settings persistence and schema migration behavior are covered.
- Lint passes.
- Typecheck passes.
- Automated tests pass.
- The production build passes.
- Critical flows have browser-level end-to-end coverage.
- Permissions have been reviewed and minimized.
- No analytics, telemetry, remote executable code, or unnecessary host access has been introduced.
- Chrome Web Store documentation and release assets are prepared.
