# FloatPlay

FloatPlay is a Chrome extension that enhances YouTube Picture-in-Picture with a compact Document Picture-in-Picture player, richer playback controls, and a local-first, privacy-conscious architecture.

## Status

FloatPlay is in final v1.0.0 release-candidate validation.

The production player, YouTube trigger and first-use guidance, Options Page, English/Brazilian Portuguese localization, deterministic release packaging, and core Chrome/YouTube smoke coverage are implemented. The repository may carry `1.0.0` metadata while the exact release candidate is being validated; that metadata does not authorize public release. Chrome Web Store publication must wait until the exact-candidate CI, local gates, real Chrome/YouTube smoke test, package inspection, repository-governance checks, and store review checklist are complete.

## Highlights

- Document Picture-in-Picture mini player for supported YouTube watch pages.
- Play/Pause, configurable seeking, timeline, volume/mute, playback speed, keyboard shortcuts, and auto-hide controls.
- Icon-only YouTube entry point with one-time onboarding guidance.
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
