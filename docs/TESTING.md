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

## YouTube trigger smoke tests

Run these tests for changes that affect the FloatPlay entry point on the YouTube page.

- **TR-01 — Placement and native controls:** on a standard `/watch` video, confirm the FloatPlay pill appears inside the active video near the lower-right, remains above the native YouTube control row/timeline, and follows the video when the page scrolls, resizes, or changes player layout.
- **TR-02 — Localization and accessibility:** confirm the visible primary label is `Open FloatPlay` in English/fallback locales and `Abrir FloatPlay` in `pt-BR`. Keyboard-focus both the primary action and dismiss action and confirm focus remains visible and the dismiss control has a meaningful localized accessible name.
- **TR-03 — Primary action:** activate the primary FloatPlay action and confirm Document Picture-in-Picture opens exactly once with the same media/session behavior as before. The YouTube trigger must not remain actionable while PiP is open.
- **TR-04 — Dismiss current video:** close PiP if needed, activate the trigger's dismiss action on video A, and confirm the trigger disappears without changing playback or native YouTube controls.
- **TR-05 — Reload restores trigger:** after TR-04, reload the page and confirm the trigger becomes available again on the same supported video.
- **TR-06 — SPA navigation restores trigger:** dismiss the trigger on video A, navigate to video B without a full page reload, and confirm the trigger becomes available again for video B.
- **TR-07 — Unsupported surfaces:** confirm Home, Shorts, and YouTube Music do not expose an actionable FloatPlay trigger and that leaving `/watch` cleans up the entry point.

## Player shell smoke tests

Run these tests for changes that affect the first production player shell or Play/Pause interaction behavior.

- **PS-01 — Visible Play/Pause control:** open FloatPlay on a standard video and confirm the visible PiP button toggles playback exactly once and updates its icon and accessible name to match the media state.
- **PS-02 — Passive PiP video surface:** click the video image inside the PiP window, away from controls, and confirm playback does not change. Pointer Play/Pause inside PiP must require activation of the explicit Play/Pause control.
- **PS-03 — Origin surface, standard video:** while PiP is active, click the non-interactive central video area left in the YouTube player and confirm playback toggles exactly once.
- **PS-04 — Origin surface, live stream:** repeat PS-03 on a live stream and confirm the behavior matches standard video playback.
- **PS-05 — Native YouTube controls:** while PiP is active, interact with visible native YouTube controls that remain on the page. FloatPlay must not intercept buttons, sliders, links, form controls, or other semantically interactive elements.
- **PS-06 — Session lifecycle regression:** verify video A → B navigation, automatic playlist progression, PiP close/restoration, and leaving `/watch` still behave as validated by Spike 0.
- **PS-07 — Localization and accessibility:** verify the Play/Pause control exposes English labels in English/fallback locales and Brazilian Portuguese labels in `pt-BR` through its accessible name. The label is not required to be visually rendered; keyboard focus on the control must remain visibly identifiable.
- **PS-08 — Bright-content control contrast:** use bright and detailed video frames and confirm the lower control area remains readable without becoming a solid toolbar. The timeline progress/track/thumb, time display, and control icons must remain distinguishable, and the contrast backdrop must disappear together with auto-hidden controls.

### Player shell validation result

PS-01 through PS-07 completed successfully on real Chrome/YouTube on Windows on 2026-08-13 after the PiP video surface was finalized as passive. Standard-video and live-stream origin clicks behaved consistently, native YouTube controls remained usable, lifecycle regressions did not reproduce, and keyboard focus remained visibly identifiable.

## Media navigation smoke tests

Run these tests for changes that affect backward or forward media navigation.

- **MN-01 — Standard backward:** on a standard video away from boundaries, activate the backward control and confirm playback moves approximately 5 seconds backward.
- **MN-02 — Standard forward:** on a standard video away from boundaries, activate the forward control and confirm playback moves approximately 5 seconds forward.
- **MN-03 — Standard boundaries:** near the beginning and end of a standard video, repeatedly activate the relevant navigation control and confirm FloatPlay never produces an invalid time or breaks playback.
- **MN-04 — Live navigation:** on a live stream with a seekable history window, move away from the live edge and confirm the backward and forward controls navigate inside the currently reported seekable range.
- **MN-05 — Live-edge guard:** repeatedly activate the forward control near the live edge and confirm FloatPlay does not intentionally seek to the exact reported range end or expose a persistent end-of-media state.
- **MN-06 — Playback regression:** confirm explicit Play/Pause, the passive PiP video image, the origin Play/Pause surface, and native YouTube controls still behave as previously validated.
- **MN-07 — Accessibility:** use keyboard navigation to focus the backward, Play/Pause, and forward controls. Each control must have a visible focus indicator and a meaningful localized accessible name.
- **MN-08 — Navigation control presentation:** confirm backward and forward use compact curved vector icons without visible timing text, remain visually centered, and provide background-only hover and active feedback without scale-based motion.

### Media navigation validation result

MN-01 through MN-08 completed successfully on real Chrome/YouTube on Windows on 2026-08-13. Standard-video and live-stream seeking remained inside valid media ranges, the live-edge guard avoided the previously observed end-of-media presentation, existing playback interactions did not regress, and the final navigation controls were approved with compact curved icons and background-only interaction feedback.

## Volume control smoke tests

Run these tests for changes that affect pointer or wheel interaction with the volume control.

- **VC-01 — Wheel over speaker:** place the pointer over the speaker button and confirm wheel input changes volume by the configured step while keeping the media and FloatPlay UI synchronized.
- **VC-02 — Wheel over slider:** reveal the volume slider, place the pointer directly over it, and confirm the same wheel directions and configured step apply as over the speaker button.
- **VC-03 — Wheel scope:** use the wheel over the video, timeline, playback controls, and other non-volume areas and confirm FloatPlay does not change volume from those wheel events.
- **VC-04 — Volume semantics:** confirm wheel changes preserve the existing mute/unmute and previous-volume behavior rather than introducing a separate volume state.

## Options Page smoke tests

Run these tests for changes that affect persisted settings, the full-page Options Page, Settings menu access, or the in-player time display preference.

- **OP-01 — Open from Chrome:** open FloatPlay's extension details and confirm the Options Page opens as a normal browser tab with the FloatPlay title, branding, favicon, and no console errors.
- **OP-02 — Open from player:** open FloatPlay on a supported YouTube video, choose `Settings` from the overflow menu, and confirm the same Options Page opens without closing or breaking the active PiP session.
- **OP-03 — Load persisted settings:** change backward seek, forward seek, volume step, auto-hide enabled state, and auto-hide delay; save; close the Options Page; reopen it; and confirm the saved values are restored.
- **OP-04 — Apply settings to player:** after saving settings, reload an already-open YouTube tab as instructed by the page, reopen FloatPlay, and confirm seek, volume-step, and auto-hide behavior use the saved values.
- **OP-05 — Reset defaults:** save non-default values, activate `Restore defaults`, and confirm backward/forward seek return to 5 seconds and auto-hide delay returns to 1 second without corrupting unrelated persisted preferences.
- **OP-06 — Validation and feedback:** enter unsupported numeric values and confirm invalid settings are not persisted; save valid values and confirm success feedback is exposed without requiring a page reload.
- **OP-07 — Time display preference:** click the timeline time display in the PiP player, confirm it toggles between elapsed/duration and remaining-time presentation, reopen FloatPlay, and confirm the selected mode persists. The Options Page must not expose a duplicate time-display setting.
- **OP-08 — Localization:** verify English UI for English/fallback browser locales and Brazilian Portuguese UI for `pt-BR`, including labels, descriptions, status feedback, and shortcut reference text.
- **OP-09 — Theme and responsiveness:** verify the Options Page follows light/dark system preference, remains usable at narrow browser widths, and preserves visible keyboard focus and readable contrast.
- **OP-10 — Keyboard accessibility:** navigate through every form control, action, and relevant in-player control using the keyboard; confirm semantic controls, visible focus, and meaningful accessible names remain intact.

## Result recording

For each browser run, record Chrome version, operating system, tested commit, date, other YouTube-modifying extensions, FloatPlay console errors, and a result or observation for every relevant scenario.

If moving the YouTube-owned media element ever proves structurally unreliable, stop production player UI work and revisit the architecture. Do not compensate with private YouTube APIs, high-frequency polling, timing hacks, or brittle selectors simply to make a scenario appear successful.

## Regression discipline

When a deterministic regression test is practical, add it with the fix. When behavior depends on the real browser or YouTube lifecycle, refine the relevant browser smoke test instead of creating a misleading mock test.
