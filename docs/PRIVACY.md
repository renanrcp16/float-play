# FloatPlay Privacy Policy

Last updated: 2026-08-21

This policy describes the current FloatPlay data-handling behavior for the version distributed through the Chrome Web Store and the current release line under development. It must remain synchronized with the shipped extension and Chrome Web Store privacy disclosures.

## Purpose

FloatPlay enhances supported YouTube and YouTube Music Picture-in-Picture experiences with a compact mini player, playback controls, keyboard interaction, Audio-only playback, and configurable preferences.

## Information FloatPlay handles

### YouTube media and page state

While FloatPlay is active on a supported YouTube or YouTube Music page, the extension reads information needed to provide playback controls and manage the Picture-in-Picture session. This can include:

- current playback time and paused state;
- current-track duration and timeline state;
- volume and mute state;
- playback rate;
- seekable media ranges;
- the active media element and its lifecycle;
- supported-route and DOM context needed to attach, move, restore, and reconcile the player safely.

This information is processed inside the browser for the active feature. FloatPlay does not retain, build, or transmit its own database of YouTube or YouTube Music watch/listening history. It processes the current supported page and media state only as needed to provide FloatPlay features.

Playback state changes initiated by FloatPlay use the active `HTMLVideoElement` as the primary media path wherever the platform state is sufficient. For volume, mute, and playback-rate compatibility with YouTube's own player state, FloatPlay also sends a narrow same-page message to a MAIN-world bridge running in the same supported YouTube tab. On YouTube Music, the bridge may additionally apply a user-requested seek to the current track and request previous/next track navigation through the page player because YouTube Music can expose cumulative media timestamps and native queue behavior that are not represented reliably by direct media-time manipulation alone.

The bridge accepts only the supported playback-state actions and invokes the corresponding YouTube player/native control behavior when available. It does not read Chrome extension storage, access FloatPlay privileged APIs, send network requests, or receive URLs, video identifiers, account identifiers, analytics identifiers, or other user data from FloatPlay.

### FloatPlay preferences

FloatPlay stores user preferences such as:

- backward and forward seek intervals;
- volume adjustment step;
- automatic control hiding and its delay;
- elapsed/remaining time display preference;
- whether clicking the PiP video surface toggles Play/Pause;
- whether regular YouTube PiP should reopen in Audio-only mode.

These preferences use Chrome extension storage. FloatPlay currently uses `chrome.storage.sync` when available, which means Chrome may synchronize the preferences through the user's Chrome account according to the user's browser settings.

YouTube Music always uses Audio-only mode as part of the supported YouTube Music experience; that requirement does not create a separate browsing-history record.

### First-use onboarding state

FloatPlay stores one boolean flag in `chrome.storage.local` after the user opens FloatPlay from the YouTube trigger or dismisses the first-use coachmark. The flag only records that this onboarding tip has already been seen so the tip is not shown repeatedly on that Chrome profile/device.

The onboarding flag does not contain YouTube URLs, video identifiers, viewing history, timestamps, analytics identifiers, or other browsing activity.

## How information is used

FloatPlay uses the information described above only to provide its disclosed Picture-in-Picture playback experience, synchronize its controls with the active YouTube or YouTube Music media experience, preserve supported navigation behavior, remember user-selected FloatPlay preferences, and avoid repeating first-use onboarding that the user has already seen.

## Data transmission and sharing

FloatPlay does not operate a FloatPlay backend and does not transmit YouTube or YouTube Music viewing/listening activity, media state, FloatPlay preferences, or onboarding state to FloatPlay-controlled servers.

The same-tab MAIN-world playback bridge described above is local communication inside the active supported YouTube page; it is not a network transmission or transfer to FloatPlay infrastructure.

FloatPlay does not include third-party analytics, advertising SDKs, or operational telemetry and does not sell user data.

When Chrome storage sync is enabled, Google Chrome may synchronize FloatPlay preferences as part of Chrome's own sync infrastructure. That synchronization is provided by the browser rather than by FloatPlay infrastructure. The first-use onboarding flag uses local extension storage rather than FloatPlay infrastructure.

## Chrome Web Store Limited Use

FloatPlay's use of information received from Chrome and supported YouTube pages is limited to providing or improving the extension's disclosed single purpose and user-facing features. FloatPlay does not use or transfer this information for personalized advertising, creditworthiness, unrelated profiling, or sale of user data, and does not allow humans to read user data except where required by applicable law or a user explicitly provides information through a support request.

FloatPlay is designed to comply with the Chrome Web Store User Data Policy, including its Limited Use requirements. If FloatPlay's data practices change, this policy and the Chrome Web Store disclosures must be updated before or together with that change.

## Retention and user control

Transient YouTube and YouTube Music media/page state is used while needed for the active feature and is not retained by FloatPlay as a viewing- or listening-history database.

Persisted FloatPlay preferences remain in Chrome extension storage until they are changed, reset, cleared through browser data controls, or otherwise removed by Chrome or extension uninstall behavior.

The first-use onboarding flag remains in local Chrome extension storage until extension data is cleared or the extension is uninstalled.

Users can restore FloatPlay's default settings from the Options Page and can remove the extension through Chrome at any time.

## Permissions and website access

FloatPlay uses the Chrome `storage` permission to save extension preferences and the local first-use onboarding flag.

FloatPlay runs content scripts only on the supported YouTube origins required by the product: `youtube.com`, `www.youtube.com`, and `music.youtube.com`. This access is used to detect and control the active supported media experience and to place the FloatPlay entry point in the relevant YouTube interface. FloatPlay does not request site access for unrelated websites.

## Changes to this policy

If FloatPlay's data-handling practices change, this policy and the Chrome Web Store privacy disclosures must be updated before or together with that change as required by applicable store policy.

## Contact and support

General questions, bug reports, and support requests can be submitted through the public FloatPlay GitHub Issues page:

https://github.com/renanrcp16/float-play/issues

Do not include personal, sensitive, account, authentication, payment, or other private information in a public GitHub issue. If a privacy request requires sharing information that should not be public, use the contact information available from the maintainer's GitHub profile to request a private communication channel before sharing that information.
