# FloatPlay Architecture

## Status

This document defines the initial architecture boundaries for FloatPlay. The architecture may be refined after Spike 0, but changes should preserve the principles described here unless an explicit architectural decision replaces them.

## Goals

The architecture should make FloatPlay:

- Resilient to YouTube SPA navigation.
- Minimally coupled to YouTube's private DOM structure.
- Easy to test without requiring YouTube for every behavioral rule.
- Explicit about lifecycle and cleanup.
- Conservative about permissions and privileged extension contexts.
- Small enough to remain understandable without unnecessary abstraction layers.

## Runtime model

The initial runtime path is:

```text
YouTube watch page
        │
        ▼
Content bootstrap
        │
        ▼
Application controller
        │
        ├── YouTubeAdapter ──> active HTMLVideoElement
        │
        └── DocumentPipManager ──> Document Picture-in-Picture
```

The production player will later add presentation and settings layers around this core.

## Architectural boundaries

### Application

Application code coordinates use cases and lifecycle. It may depend on contracts exposed by infrastructure components but should not contain YouTube selector knowledge.

Examples:

- Reconciling whether a supported media source exists.
- Opening or ending a FloatPlay session.
- Rebinding future player state to a newly active media source.

### Infrastructure — YouTube

YouTube integration owns knowledge required to find and observe the active media source on YouTube.

This layer should prefer platform-neutral media characteristics over private YouTube implementation details.

The initial spike intentionally selects the largest visible connected `<video>` element on a supported watch page instead of depending on YouTube-specific video classes.

### Infrastructure — Picture-in-Picture

The Picture-in-Picture layer owns:

- Document Picture-in-Picture capability detection.
- Window creation.
- Media movement into the PiP document.
- PiP document styling required by the integration.
- Safe restoration of the media node.
- PiP lifecycle cleanup.

It must not own YouTube navigation logic.

### Presentation

Presentation owns visual controls, focus behavior, menus, and responsive layout.

The technical spike contains only a temporary isolated trigger required to provide a valid user gesture. It is not the v1 visual design.

### Settings

Settings will be introduced after the feasibility spike and will use a versioned schema with Chrome extension storage.

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

Cleanup must be idempotent where practical.

## PiP restoration strategy

Before moving a media element, FloatPlay records its logical DOM position with a placeholder and original parent relationship.

When the PiP window closes:

1. Prefer replacing the still-connected placeholder with the media node.
2. If the placeholder is gone but the original parent remains valid, restore relative to the recorded sibling when possible.
3. Do not insert the media node into an arbitrary fallback container merely to keep it connected.
4. Surface a structured failure for investigation if no safe restoration target remains.

Spike 0 exists specifically to determine whether this strategy remains reliable against YouTube's real player lifecycle.

## Shadow DOM isolation

Temporary and production FloatPlay controls injected into YouTube should use an isolated styling boundary where appropriate so that YouTube CSS does not accidentally style FloatPlay controls and FloatPlay CSS does not leak into YouTube.

## Privilege model

The initial spike requires no extension service worker and no privileged background operations.

A service worker should be introduced only when a concrete feature requires background extension APIs or coordination that cannot live safely in the existing contexts.

## Dependency rule

Dependencies are added only when they solve a meaningful problem more clearly or safely than available platform APIs.

The initial toolchain uses Vite for extension bundling, TypeScript for static type safety, and ESLint with typescript-eslint for linting.

React is intentionally undecided until the technical spike establishes the real presentation complexity.

## Testing strategy

Testing will grow in layers:

- Unit tests for deterministic rules and calculations.
- Integration tests for media-control behavior.
- Browser-level tests for extension lifecycle and critical flows.
- Manual smoke tests against the real YouTube application.

Tests should assert user-visible or behavioral outcomes rather than implementation details when possible.

## Future architectural decisions

Decisions with long-term structural impact should be recorded as short Architecture Decision Records under `docs/decisions/` once the first such decision needs to be preserved.
