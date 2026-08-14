# FloatPlay Privacy Policy (Draft)

Last updated: 2026-08-14

This draft describes the current FloatPlay v1 data-handling behavior. Publish an accurate copy at a stable public URL before Chrome Web Store submission and keep it synchronized with the shipped extension.

## Purpose

FloatPlay enhances supported YouTube Picture-in-Picture experiences with a compact mini player, playback controls, keyboard interaction, and configurable preferences.

## Information FloatPlay handles

### YouTube media and page state

While FloatPlay is active on a supported YouTube page, the extension reads information needed to provide playback controls and manage the Picture-in-Picture session. This can include:

- current playback time and paused state;
- volume and mute state;
- playback rate;
- seekable media ranges;
- the active media element and its lifecycle;
- supported-route and DOM context needed to attach, move, restore, and reconcile the player safely.

This information is processed inside the browser for the active feature. FloatPlay does not maintain its own watch-history database.

### FloatPlay preferences

FloatPlay stores user preferences such as:

- backward and forward seek intervals;
- volume adjustment step;
- automatic control hiding and its delay;
- elapsed/remaining time display preference.

These preferences use Chrome extension storage. FloatPlay currently uses `chrome.storage.sync` when available, which means Chrome may synchronize the preferences through the user's Chrome account according to the user's browser settings.

## How information is used

FloatPlay uses the information described above only to provide its disclosed Picture-in-Picture playback experience, synchronize its controls with the active YouTube media element, preserve supported navigation behavior, and remember user-selected FloatPlay preferences.

## Data transmission and sharing

FloatPlay does not operate a FloatPlay backend and does not transmit YouTube viewing activity, media state, or FloatPlay preferences to FloatPlay-controlled servers.

FloatPlay does not include third-party analytics, advertising SDKs, or operational telemetry and does not sell user data.

When Chrome storage sync is enabled, Google Chrome may synchronize FloatPlay preferences as part of Chrome's own sync infrastructure. That synchronization is provided by the browser rather than by FloatPlay infrastructure.

## Retention and user control

Transient YouTube media/page state is used while needed for the active feature and is not retained by FloatPlay as viewing history.

Persisted FloatPlay preferences remain in Chrome extension storage until they are changed, reset, cleared through browser data controls, or otherwise removed by Chrome or extension uninstall behavior.

Users can restore FloatPlay's default settings from the Options Page and can remove the extension through Chrome at any time.

## Permissions and website access

FloatPlay uses the Chrome `storage` permission to save extension preferences.

FloatPlay runs content scripts on YouTube origins required to detect and control the active supported media experience. FloatPlay does not request site access for unrelated websites.

## Changes to this policy

If FloatPlay's data-handling practices change, this policy and the Chrome Web Store privacy disclosures must be updated before or together with the change as required by applicable store policy.

## Contact

Before public release, replace this section with the final public support/contact channel that will be maintained for FloatPlay users.
