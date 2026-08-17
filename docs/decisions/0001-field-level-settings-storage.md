# ADR 0001 — Field-level settings storage

## Status

Accepted for FloatPlay v1 hardening.

## Context

FloatPlay has two independent writers for synchronized preferences:

- the Options Page updates seek, volume-step, and auto-hide preferences;
- the PiP player updates `timeDisplayMode` directly from the timeline control.

The original v1 development representation stored every preference inside one `settings` object in `chrome.storage.sync`. Each writer loaded that full object, changed one subset, and wrote the complete object again. Two near-simultaneous writers could therefore start from the same stale snapshot and let the final full-object write silently revert the other writer's preference.

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

## Migration

The previous `settings` object remains a read-only legacy fallback during v1 development migration.

`ChromeSettingsStore.load()`:

1. reads the legacy object and all v1 field keys;
2. normalizes the legacy object using the existing v1 schema rules;
3. overlays any valid `settings.v1.*` field values on top of that legacy/default baseline;
4. returns one normalized `FloatPlaySettings` value to application code.

This keeps existing development-profile preferences usable without requiring a destructive migration or a background migration job. New writes use only the field-level v1 keys.

## Consequences

- Independent writes cannot silently revert unrelated preferences through a stale full-object snapshot.
- Resetting Options Page defaults is explicitly scoped to the preferences displayed on that page.
- The application still consumes one normalized `FloatPlaySettings` object; the storage representation remains an infrastructure detail.
- No new permission, backend, network request, analytics, telemetry, or data category is introduced.
- A future settings schema should use a new versioned namespace or an explicit migration rather than silently changing the meaning of existing `settings.v1.*` keys.

## Validation

Unit tests cover legacy fallback, field-level precedence, partial writes, and interleaved independent updates. Browser E2E verifies that Options Page save/reset operations preserve the player-owned `timeDisplayMode` preference.
