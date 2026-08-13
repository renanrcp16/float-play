# FloatPlay Architecture

## Status

Spike 0 is complete and the core Document Picture-in-Picture feasibility assumptions have been validated against real Chrome and YouTube behavior. This document defines the current architecture boundaries for FloatPlay. Future structural changes should preserve these principles unless an explicit architectural decision replaces them.

## Goals

The architecture should make FloatPlay:

- Resilient to YouTube SPA navigation.
- Minimally coupled to YouTube's private DOM structure.
- Easy to test without requiring YouTube for every behavioral rule.
- Explicit about lifecycle and cleanup.
- Conservative about permissions and privileged extension contexts.
- Small enough to remain understandable without unnecessary abstraction layers.

## Runtime model

The current runtime path is:

```text
YouTube watch page
        │
        ▼
Content bootstrap
        │
        ▼
FloatPlayController
        │
        ├── YouTubeAdapter ──> active HTMLVideoElement
        │
        └── DocumentPipManager ──> active PiP session
                                      │
                    ┌─────────────────┴─────────────────┐
                    ▼                                   ▼
             PlayerShell                     OriginPlaybackSurface
          (PiP presentation)                 (YouTube origin surface)
```

The active `HTMLVideoElement` remains shared across these layers and is the playback source of truth.

## Architectural boundaries

### Application

Application code coordinates use cases and lifecycle. It may depend on contracts exposed by infrastructure and presentation components but should not contain YouTube selector knowledge.

Examples:

- Reconciling whether a supported media source exists.
- Opening or ending a FloatPlay session.
- Mounting presentation components for an active PiP session.
- Rebinding future player state to a newly active media source.

Playback rules that do not require DOM knowledge, such as toggling Play/Pause against a media contract, belong in application-level helpers so they can be tested independently.

### Infrastructure — YouTube

YouTube integration owns knowledge required to find and observe the active media source on YouTube.

This layer should prefer platform-neutral media characteristics over private YouTube implementation details.

The current adapter selects the largest visible connected `<video>` element on a supported watch page instead of depending on YouTube-specific video classes.

### Infrastructure — Picture-in-Picture

The Picture-in-Picture layer owns:

- Document Picture-in-Picture capability detection.
- Window creation.
- Media movement into the PiP document.
- Initial window geometry hints.
- PiP document styling required by the integration.
- Safe restoration of the media node.
- PiP lifecycle cleanup.
- A minimal session context for presentation components.

It must not own YouTube navigation logic or presentation behavior.

### Infrastructure — Chrome

Chrome-specific adapters should remain narrow. The current Chrome i18n adapter exposes localized extension messages without coupling presentation components directly to global Chrome APIs.

### Presentation

Presentation owns visual controls, focus behavior, menus, responsive layout, and interaction surfaces.

The first production presentation slice consists of:

- `PlayerShell`, rendered inside the Document PiP window.
- `OriginPlaybackSurface`, which preserves a predictable Play/Pause interaction on the non-interactive central area of the original YouTube player while the media element is inside PiP.

The PiP video image itself is passive. Clicking the video image does not toggle playback; Play/Pause inside the PiP window is performed through the explicit semantic control.

The origin interaction layer must not intentionally intercept native YouTube buttons, sliders, links, form controls, or other semantically interactive elements. This keeps FloatPlay behavior predictable without depending on private YouTube player classes.

### Settings

Settings will use a versioned schema with Chrome extension storage when the Options Page is introduced.

## Source-of-truth rules

The active `HTMLVideoElement` is authoritative for:

- Paused/playing state.
- Current time.
- Duration and seekable ranges.
- Volume.
- Muted state.
- Playback rate.

FloatPlay presentation state must reflect media events rather than attempting to maintain a second authoritative media model.

## State categories

FloatPlay distinguishes three categories of state:

### Media state

Owned by the active media element.

### Application state

Examples include whether FloatPlay has an active PiP session and which media element is currently bound.

### Presentation state

Examples include whether an overflow menu is open or whether controls are currently visible.

These categories may interact but should not be collapsed into one global mutable object.

## YouTube SPA strategy

YouTube is a single-page application. A content script cannot assume a full page reload for every video navigation.

The preferred strategy is:

1. Observe relevant DOM changes without continuous polling.
2. Coalesce bursts of DOM changes.
3. Reconcile current application state against the current page and media state.
4. Rebind only when the active source actually changes.

The project should avoid depending exclusively on private YouTube navigation events.

## Cleanup rule

Any component that creates a listener, observer, animation frame, timer, subscription, or separate window must own an explicit cleanup path.

Cleanup must be idempotent where practical. Presentation components created for a PiP session are tied to that session's abort signal so their listeners are removed when the session ends.

## PiP restoration strategy

Before moving a media element, FloatPlay records its logical DOM position with a placeholder and original parent relationship.

When the PiP window closes:

1. Prefer replacing the still-connected placeholder with the media node.
2. If the placeholder is gone but the original parent remains valid, restore relative to the recorded sibling when possible.
3. Do not insert the media node into an arbitrary fallback container merely to keep it connected.
4. Surface a structured failure for investigation if no safe restoration target remains.

Spike 0 validated this strategy against repeated open/close cycles, SPA video navigation, playlist progression, live playback, advertising transitions, unsupported-route cleanup, and full opener reload behavior. These scenarios remain regression requirements.

## Styling isolation

FloatPlay UI injected into the YouTube document should use an isolated styling boundary when it owns visible markup so YouTube CSS does not accidentally style FloatPlay controls and FloatPlay CSS does not leak into YouTube.

The PiP player shell lives in its own Document PiP document and therefore has a separate document styling scope. Interaction behavior attached to existing YouTube elements should avoid unnecessary style mutation.

## Privilege model

The current implementation requires no extension service worker and no privileged background operations.

A service worker should be introduced only when a concrete feature requires background extension APIs or coordination that cannot live safely in the existing contexts.

## Dependency rule

Dependencies are added only when they solve a meaningful problem more clearly or safely than available platform APIs.

The toolchain uses Vite for extension bundling, TypeScript for static type safety, ESLint with typescript-eslint for linting, and Vitest for automated tests.

The first production player shell is implemented with native DOM APIs. React remains intentionally deferred and should be introduced only if future presentation complexity creates a concrete maintainability benefit that outweighs the additional runtime and architectural cost.

## Testing strategy

Testing grows in layers:

- Unit tests for deterministic rules and calculations.
- Integration tests for media-control behavior.
- Browser-level tests for extension lifecycle and critical flows.
- Manual smoke tests against the real YouTube application.

Tests should assert user-visible or behavioral outcomes rather than implementation details when possible. Real YouTube smoke tests remain mandatory for integration behavior that cannot be represented faithfully with isolated mocks.

## Future architectural decisions

Decisions with long-term structural impact should be recorded as short Architecture Decision Records under `docs/decisions/` once the first such decision needs to be preserved.