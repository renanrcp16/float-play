import { describe, expect, test, vi } from "vitest";
import { DEFAULT_SETTINGS, SETTINGS_SCHEMA_VERSION } from "../../application/Settings";
import type { Logger } from "../../shared/Logger";
import { ChromeSettingsStore } from "./ChromeSettingsStore";
import type { ChromeStorageArea } from "./ChromeStorageArea";

function createLogger() {
  return {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  } satisfies Logger;
}

function createMemoryStorage(initial: Record<string, unknown> = {}): ChromeStorageArea {
  const values: Record<string, unknown> = { ...initial };

  return {
    get: vi.fn((keys: string | string[]) => {
      const requestedKeys = Array.isArray(keys) ? keys : [keys];
      return Promise.resolve(Object.fromEntries(
        requestedKeys
          .filter((key) => key in values)
          .map((key) => [key, values[key]])
      ));
    }),
    set: vi.fn((items: Record<string, unknown>) => {
      Object.assign(values, items);
      return Promise.resolve();
    })
  };
}

describe("ChromeSettingsStore", () => {
  test("loads and normalizes the canonical v1 field-level settings", async () => {
    const storage = createMemoryStorage({
      "settings.v1.schemaVersion": SETTINGS_SCHEMA_VERSION,
      "settings.v1.seekBackwardSeconds": 15,
      "settings.v1.autoHideEnabled": false,
      "settings.v1.timeDisplayMode": "remaining"
    });
    const store = new ChromeSettingsStore(createLogger(), storage);

    await expect(store.load()).resolves.toEqual({
      ...DEFAULT_SETTINGS,
      seekBackwardSeconds: 15,
      autoHideEnabled: false,
      timeDisplayMode: "remaining"
    });
  });

  test("ignores the pre-v1 legacy settings object", async () => {
    const storage = createMemoryStorage({
      settings: {
        ...DEFAULT_SETTINGS,
        seekBackwardSeconds: 15,
        timeDisplayMode: "remaining"
      }
    });
    const store = new ChromeSettingsStore(createLogger(), storage);

    await expect(store.load()).resolves.toEqual(DEFAULT_SETTINGS);
    expect(storage.get).toHaveBeenCalledWith([
      "settings.v1.schemaVersion",
      "settings.v1.seekBackwardSeconds",
      "settings.v1.seekForwardSeconds",
      "settings.v1.volumeStep",
      "settings.v1.autoHideEnabled",
      "settings.v1.autoHideDelayMs",
      "settings.v1.timeDisplayMode"
    ]);
  });

  test("uses defaults when the v1 schema version is missing", async () => {
    const storage = createMemoryStorage({
      "settings.v1.seekBackwardSeconds": 15
    });
    const store = new ChromeSettingsStore(createLogger(), storage);

    await expect(store.load()).resolves.toEqual(DEFAULT_SETTINGS);
  });

  test("uses defaults for an unsupported persisted schema version", async () => {
    const storage = createMemoryStorage({
      "settings.v1.schemaVersion": SETTINGS_SCHEMA_VERSION + 1,
      "settings.v1.seekBackwardSeconds": 15
    });
    const store = new ChromeSettingsStore(createLogger(), storage);

    await expect(store.load()).resolves.toEqual(DEFAULT_SETTINGS);
  });

  test("falls back to defaults when sync storage is unavailable", async () => {
    const logger = createLogger();
    const store = new ChromeSettingsStore(logger, null);

    await expect(store.load()).resolves.toEqual(DEFAULT_SETTINGS);
    expect(logger.warn).toHaveBeenCalledOnce();
  });

  test("falls back to defaults when loading fails", async () => {
    const logger = createLogger();
    const storage: ChromeStorageArea = {
      get: vi.fn(() => Promise.reject(new Error("storage failure"))),
      set: vi.fn(() => Promise.resolve())
    };
    const store = new ChromeSettingsStore(logger, storage);

    await expect(store.load()).resolves.toEqual(DEFAULT_SETTINGS);
    expect(logger.error).toHaveBeenCalledOnce();
  });

  test("writes only the requested preference and schema version", async () => {
    const set = vi.fn(() => Promise.resolve());
    const storage: ChromeStorageArea = {
      get: vi.fn(() => Promise.resolve({})),
      set
    };
    const store = new ChromeSettingsStore(createLogger(), storage);

    await store.update({ timeDisplayMode: "remaining" });

    expect(set).toHaveBeenCalledWith({
      "settings.v1.schemaVersion": SETTINGS_SCHEMA_VERSION,
      "settings.v1.timeDisplayMode": "remaining"
    });
  });

  test("preserves independent preferences across interleaved updates", async () => {
    const storage = createMemoryStorage();
    const store = new ChromeSettingsStore(createLogger(), storage);

    await Promise.all([
      store.update({ timeDisplayMode: "remaining" }),
      store.update({ seekForwardSeconds: 20 })
    ]);

    await expect(store.load()).resolves.toEqual({
      ...DEFAULT_SETTINGS,
      seekForwardSeconds: 20,
      timeDisplayMode: "remaining"
    });
  });
});
