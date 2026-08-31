# FloatPlay

FloatPlay is a Chrome extension that enhances YouTube and YouTube Music Picture-in-Picture with a compact Document Picture-in-Picture player, richer playback controls, and a local-first, privacy-conscious architecture.

## Status

FloatPlay `v1.1.2` is publicly available on the Chrome Web Store. This focused hotfix improves YouTube live-stream Picture-in-Picture timeline behavior.

- [Install FloatPlay from the Chrome Web Store](https://chromewebstore.google.com/detail/floatplay/eegmhncffdkhjlnnifaaghkgfphicpgo)
- [View FloatPlay GitHub Releases](https://github.com/renanrcp16/float-play/releases)

The v1.1 line includes supported YouTube Music playback, persistent Audio-only mode for standard YouTube, optional click-on-video Play/Pause inside PiP, compact-player layout fixes, more reliable playback interaction on the original YouTube player surface, and live-stream DVR-aware PiP timeline behavior.

## Highlights

- Document Picture-in-Picture mini player for supported YouTube watch pages and YouTube Music.
- Play/Pause, configurable seeking, timeline, volume/mute, playback speed, keyboard shortcuts, and auto-hide controls.
- YouTube live streams use the native DVR coordinate space for PiP seeking and show a stable `LIVE` / `AO VIVO` action instead of an unreliable numeric live clock.
- YouTube Music Audio-only playback with current-track timeline plus previous/next track controls.
- Persistent Audio-only preference for standard YouTube and optional PiP video-surface Play/Pause.
- Icon-only YouTube/YouTube Music entry points with one-time onboarding guidance.
- Full Options Page with synchronized preferences and English/Brazilian Portuguese localization.
- No FloatPlay backend, analytics, telemetry, authentication, or unrelated host access.
- Manifest V3 with a deliberately small permission and release-artifact surface.

## Documentation

- [Product requirements](docs/PRD.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Testing](docs/TESTING.md)
- [Release readiness](docs/RELEASE.md)
- [Chrome Web Store preparation](docs/WEB_STORE.md)
- [Privacy policy](docs/PRIVACY.md)
- [Security policy](.github/SECURITY.md)
- [Contributing](CONTRIBUTING.md)
- [Agent instructions](AGENTS.md)

## Development

Development setup, validation commands, CI expectations, Git workflow, and contribution requirements are documented in [CONTRIBUTING.md](CONTRIBUTING.md).

The canonical local validation command is:

```bash
pnpm validate
```

## License

FloatPlay is source-available under the [PolyForm Noncommercial License 1.0.0](LICENSE).

You may use, study, modify, and distribute FloatPlay for permitted noncommercial purposes. Commercial use is not permitted under this license.

See [LICENSE](LICENSE) for the full terms and [NOTICE](NOTICE) for the required copyright notice.
