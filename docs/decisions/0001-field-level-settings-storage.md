# ADR 0001 — Field-level settings storage

## Status

Accepted for FloatPlay v1.

## Context

FloatPlay has two independent writers for synchronized preferences:

- the Options Page updates seek, volume-step, and auto-hide preferences;
- the PiP player updates `timeDisplayMode` directly from the timeline control.

The original pre-release development representation stored every preference inside one `settings` object in `chrome.storage.sync`. Each writer loaded that full object, changed one subset, and wrote the complete object again. Two near-simultaneous writers could therefore start from the same stale snapshot and let the final full-object write silently revert the other writer's preference.

No public FloatPlay release used that single-object representation.

## Decision

Persist v1 synchronized preferences as independent top-level Chrome storage keys under the `settings.v1.*` namespace.

The current keys are:

- `settings.v1.schemaVersion`
- `settings.v1.seekBackwardSeconds`
- `settings.v1.seekForwardSeconds`
- `settings.v1.volumeStep`
- `settings.v1.autoHideEnabled`
- `settings.v1.autoHideDelayMs`
- `settings.v1.timeDisplayMode`

`ChromeSettingsStore.update()` accepts a partial settings patch and writes only the fields present in that patch plus the v1 schema-version key. Chrome storage `set()` merges top-level keys, so independent preference writers no longer need to rewrite unrelated values.

The Options Page owns only its five visible/configurable fields. Saving or restoring defaults must not write `timeDisplayMode`. The PiP timeline control writes only `timeDisplayMode`.

`ChromeSettingsStore.load()` reads only the field-level v1 keys. Persisted fields are accepted only when `settings.v1.schemaVersion` matches the supported schema version. Missing or unsupported schema versions fail safely to v1 defaults rather than guessing how unknown data should be interpreted.

## Pre-release compatibility cleanup

During development, FloatPlay temporarily read the old `settings` object as a fallback so existing development profiles could survive the transition to field-level keys.

That fallback was intentionally removed before the first public release. Shipping it in v1 would have created a legacy contract for a representation that no public user ever depended on.

The public v1 storage contract therefore begins with one representation only: the versioned `settings.v1.*` keys above. The old `settings` key is neither requested nor interpreted by v1 builds.

## Consequences

- Independent writes cannot silently revert unrelated preferences through a stale full-object snapshot.
- Resetting Options Page defaults is explicitly scoped to the preferences displayed on that page.
- The application still consumes one normalized `FloatPlaySettings` object; the storage representation remains an infrastructure detail.
- Unknown or missing schema versions fail closed to defaults until an explicit migration is implemented.
- No development-only legacy representation becomes part of the public compatibility promise.
- No new permission, backend, network request, analytics, telemetry, or data category is introduced.
- A future settings schema must use a new versioned namespace or an explicit, tested migration rather than silently changing the meaning of existing `settings.v1.*` keys.

## Validation

Unit tests cover canonical v1 field loading, rejection of the pre-v1 legacy object, missing/unsupported schema handling, partial writes, and interleaved independent updates. Browser E2E verifies that Options Page save/reset operations preserve the player-owned `timeDisplayMode` preference.
