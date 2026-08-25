# FloatPlay

FloatPlay is a Chrome extension that enhances YouTube and YouTube Music Picture-in-Picture with a compact Document Picture-in-Picture player, richer playback controls, and a local-first, privacy-conscious architecture.

## Status

FloatPlay `v1.1.0` is publicly available on the Chrome Web Store. The `v1.1.1` hotfix is being prepared to remove unreliable PiP hover dimming while preserving optional click-on-video Play/Pause.

- [Install FloatPlay from the Chrome Web Store](https://chromewebstore.google.com/detail/floatplay/eegmhncffdkhjlnnifaaghkgfphicpgo)
- [View the v1.1.0 GitHub Release](https://github.com/renanrcp16/float-play/releases/tag/v1.1.0)

The v1.1 line includes supported YouTube Music playback, persistent Audio-only mode for standard YouTube, optional click-on-video Play/Pause inside PiP, compact-player layout fixes, and more reliable playback interaction on the original YouTube player surface.

## Highlights

- Document Picture-in-Picture mini player for supported YouTube watch pages and YouTube Music.
- Play/Pause, configurable seeking, timeline, volume/mute, playback speed, keyboard shortcuts, and auto-hide controls.
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
