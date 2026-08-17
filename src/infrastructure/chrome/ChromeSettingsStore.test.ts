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
  test("loads and normalizes the legacy settings object", async () => {
    const storage = createMemoryStorage({
      settings: {
        schemaVersion: SETTINGS_SCHEMA_VERSION,
        seekBackwardSeconds: 15,
        autoHideEnabled: false
      }
    });
    const store = new ChromeSettingsStore(createLogger(), storage);

    await expect(store.load()).resolves.toEqual({
      ...DEFAULT_SETTINGS,
      seekBackwardSeconds: 15,
      autoHideEnabled: false
    });
  });

  test("prefers independently persisted v1 fields while retaining legacy fallbacks", async () => {
    const storage = createMemoryStorage({
      settings: {
        ...DEFAULT_SETTINGS,
        seekBackwardSeconds: 15,
        timeDisplayMode: "elapsed"
      },
      "settings.v1.schemaVersion": SETTINGS_SCHEMA_VERSION,
      "settings.v1.timeDisplayMode": "remaining"
    });
    const store = new ChromeSettingsStore(createLogger(), storage);

    await expect(store.load()).resolves.toEqual({
      ...DEFAULT_SETTINGS,
      seekBackwardSeconds: 15,
      timeDisplayMode: "remaining"
    });
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
    const storage = createMemoryStorage({
      settings: DEFAULT_SETTINGS
    });
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
