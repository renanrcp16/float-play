# FloatPlay Testing

This document is the canonical source for browser and YouTube smoke-test procedures. Product release requirements remain in `docs/PRD.md`; development workflow remains in `CONTRIBUTING.md`.

## Automated validation

Run `pnpm validate` before browser testing. It runs lint, TypeScript type checking, automated tests, and the production build. Browser-facing changes still require real Chrome and YouTube validation.

## Spike 0 foundation gates

- **S0-01 — Supported route:** a standard `youtube.com/watch` page exposes the temporary FloatPlay trigger after a compatible video exists.
- **S0-02 — Unsupported surfaces:** YouTube Home, Shorts, and YouTube Music do not expose an actionable trigger.
- **S0-03 — Open PiP:** activating the trigger opens Document Picture-in-Picture with the active video.
- **S0-04 — Playback continuity:** moving the video does not structurally break playback.
- **S0-05 — State preservation:** current time, volume, mute state, and playback rate are preserved. An external rate above 2x is not reduced merely by opening FloatPlay.
- **S0-06 — Restore:** closing PiP restores the exact video element to its original logical DOM position.
- **S0-07 — Repeatability:** repeated open/close cycles do not create duplicate behavior, lose the media element, or accumulate FloatPlay errors.
- **S0-08 — Resize and aspect ratio:** the initial PiP window should follow the media's intrinsic aspect ratio when dimensions are available. User-driven native window resizing may change the window aspect ratio; FloatPlay must keep the full video visible with `object-fit: contain` rather than cropping it.

## Spike 0 architectural investigation

These scenarios must be observed before production player UI work begins. A failure may require an architecture change rather than a patch.

- **S0-09 — SPA navigation:** open FloatPlay on video A, navigate to video B without a full reload, and record whether YouTube reuses or replaces the media element.
- **S0-10 — Playlist progression:** allow a playlist to advance naturally and record the media lifecycle.
- **S0-11 — Live stream:** inspect `duration`, `seekable`, playback continuity, and restoration.
- **S0-12 — Advertising:** observe a natural ad transition when available. FloatPlay must not block or skip the ad.
- **S0-13 — Leave `/watch`:** navigate to an unsupported YouTube surface and record cleanup behavior.
- **S0-14 — Full reload:** destroy or reload the opener document and confirm browser-level PiP lifecycle behavior.

## Result recording

For each run, record Chrome version, operating system, tested commit, date, other YouTube-modifying extensions, FloatPlay console errors, and a result or observation for every relevant scenario.

If moving the YouTube-owned media element proves structurally unreliable, stop production player UI work and revisit the architecture. Do not compensate with private YouTube APIs, high-frequency polling, timing hacks, or brittle selectors simply to make the spike appear successful.

## Regression discipline

When a deterministic regression test is practical, add it with the fix. When behavior depends on the real browser or YouTube lifecycle, refine the relevant browser smoke test instead of creating a misleading mock test.
