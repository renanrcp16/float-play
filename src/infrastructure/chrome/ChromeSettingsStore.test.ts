import { describe, expect, test, vi } from "vitest";
import { DEFAULT_SETTINGS, SETTINGS_SCHEMA_VERSION } from "../../application/Settings";
import type { Logger } from "../../shared/Logger";
import { ChromeSettingsStore } from "./ChromeSettingsStore";
import type { SettingsStorageArea } from "./ChromeSettingsStore";

function createLogger(): Logger {
  return {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  };
}

describe("ChromeSettingsStore", () => {
  test("loads and normalizes settings from sync storage", async () => {
    const storage: SettingsStorageArea = {
      get: vi.fn(async () => ({
        settings: {
          schemaVersion: SETTINGS_SCHEMA_VERSION,
          seekBackwardSeconds: 15,
          autoHideEnabled: false
        }
      })),
      set: vi.fn(async () => undefined)
    };

    const store = new ChromeSettingsStore(createLogger(), storage);

    await expect(store.load()).resolves.toEqual({
      ...DEFAULT_SETTINGS,
      seekBackwardSeconds: 15,
      autoHideEnabled: false
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
    const storage: SettingsStorageArea = {
      get: vi.fn(async () => {
        throw new Error("storage failure");
      }),
      set: vi.fn(async () => undefined)
    };
    const store = new ChromeSettingsStore(logger, storage);

    await expect(store.load()).resolves.toEqual(DEFAULT_SETTINGS);
    expect(logger.error).toHaveBeenCalledOnce();
  });

  test("saves normalized settings under the versioned settings key", async () => {
    const set = vi.fn(async () => undefined);
    const storage: SettingsStorageArea = {
      get: vi.fn(async () => ({})),
      set
    };
    const store = new ChromeSettingsStore(createLogger(), storage);

    await store.save({
      ...DEFAULT_SETTINGS,
      seekForwardSeconds: 20
    });

    expect(set).toHaveBeenCalledWith({
      settings: {
        ...DEFAULT_SETTINGS,
        seekForwardSeconds: 20
      }
    });
  });
});
