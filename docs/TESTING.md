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
- **S0-08 — Resize and aspect ratio:** the initial PiP window follows the media's intrinsic aspect ratio when dimensions are available. Reopening asks Chrome to prefer the freshly calculated initial geometry instead of the user's previous manual resize. User-driven native resizing may still change the window aspect ratio; FloatPlay keeps the full video visible with `object-fit: contain` rather than cropping it.

## Spike 0 architectural investigation

These scenarios were used to validate the architecture before production player UI work began.

- **S0-09 — SPA navigation:** open FloatPlay on video A, navigate to video B without a full reload, and record whether YouTube reuses or replaces the media element.
- **S0-10 — Playlist progression:** allow a playlist to advance naturally and record the media lifecycle.
- **S0-11 — Live stream:** inspect `duration`, `seekable`, playback continuity, and restoration.
- **S0-12 — Advertising:** observe a natural ad transition when available. FloatPlay must not block or skip the ad.
- **S0-13 — Leave `/watch`:** navigate to an unsupported YouTube surface and record cleanup behavior.
- **S0-14 — Full reload:** destroy or reload the opener document and confirm browser-level PiP lifecycle behavior.

### Spike 0 result

Spike 0 completed successfully on real Chrome/YouTube on Windows on 2026-08-13.

The validated behavior included media transfer and restoration, repeated open/close cycles, supported and unsupported routes, SPA video-to-video navigation, automatic playlist progression, live playback with a non-empty seekable range, natural advertising transitions, clean PiP termination when leaving `/watch`, and browser-driven PiP closure on full opener reload.

The live test also showed that seeking directly to the reported end of the seekable range can briefly expose YouTube end-of-media presentation before returning to the live edge. Production live timeline behavior must therefore use the actual seekable range conservatively rather than treating its exact end as a semantic equivalent of YouTube's "Live" control.

## Player shell smoke tests

Run these tests for changes that affect the first production player shell or Play/Pause interaction behavior.

- **PS-01 — Visible Play/Pause control:** open FloatPlay on a standard video and confirm the visible PiP button toggles playback exactly once and updates its icon and accessible name to match the media state.
- **PS-02 — Passive PiP video surface:** click the video image inside the PiP window, away from controls, and confirm playback does not change. Pointer Play/Pause inside PiP must require activation of the explicit Play/Pause control.
- **PS-03 — Origin surface, standard video:** while PiP is active, click the non-interactive central video area left in the YouTube player and confirm playback toggles exactly once.
- **PS-04 — Origin surface, live stream:** repeat PS-03 on a live stream and confirm the behavior matches standard video playback.
- **PS-05 — Native YouTube controls:** while PiP is active, interact with visible native YouTube controls that remain on the page. FloatPlay must not intercept buttons, sliders, links, form controls, or other semantically interactive elements.
- **PS-06 — Session lifecycle regression:** verify video A → B navigation, automatic playlist progression, PiP close/restoration, and leaving `/watch` still behave as validated by Spike 0.
- **PS-07 — Localization and accessibility:** verify the Play/Pause control exposes English labels in English/fallback locales and Brazilian Portuguese labels in `pt-BR` through its accessible name. The label is not required to be visually rendered; keyboard focus on the control must remain visibly identifiable.

### Player shell validation result

PS-01 through PS-07 completed successfully on real Chrome/YouTube on Windows on 2026-08-13 after the PiP video surface was finalized as passive. Standard-video and live-stream origin clicks behaved consistently, native YouTube controls remained usable, lifecycle regressions did not reproduce, and keyboard focus remained visibly identifiable.

## Media navigation smoke tests

Run these tests for changes that affect backward or forward media navigation.

- **MN-01 — Standard backward:** on a standard video away from boundaries, activate `-10` and confirm playback moves approximately 10 seconds backward.
- **MN-02 — Standard forward:** on a standard video away from boundaries, activate `+10` and confirm playback moves approximately 10 seconds forward.
- **MN-03 — Standard boundaries:** near the beginning and end of a standard video, repeatedly activate the relevant navigation control and confirm FloatPlay never produces an invalid time or breaks playback.
- **MN-04 — Live navigation:** on a live stream with a seekable history window, move away from the live edge and confirm `-10` and `+10` navigate inside the currently reported seekable range.
- **MN-05 — Live-edge guard:** repeatedly activate `+10` near the live edge and confirm FloatPlay does not intentionally seek to the exact reported range end or expose a persistent end-of-media state.
- **MN-06 — Playback regression:** confirm explicit Play/Pause, the passive PiP video image, the origin Play/Pause surface, and native YouTube controls still behave as previously validated.
- **MN-07 — Accessibility:** use keyboard navigation to focus the backward, Play/Pause, and forward controls. Each control must have a visible focus indicator and a meaningful localized accessible name.

## Result recording

For each browser run, record Chrome version, operating system, tested commit, date, other YouTube-modifying extensions, FloatPlay console errors, and a result or observation for every relevant scenario.

If moving the YouTube-owned media element ever proves structurally unreliable, stop production player UI work and revisit the architecture. Do not compensate with private YouTube APIs, high-frequency polling, timing hacks, or brittle selectors simply to make a scenario appear successful.

## Regression discipline

When a deterministic regression test is practical, add it with the fix. When behavior depends on the real browser or YouTube lifecycle, refine the relevant browser smoke test instead of creating a misleading mock test.
