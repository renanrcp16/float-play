import { DEFAULT_SETTINGS, normalizeSettings } from "../../application/Settings";
import type { FloatPlaySettings } from "../../application/Settings";
import type { Logger } from "../../shared/Logger";
import type { ChromeStorageArea } from "./ChromeStorageArea";

const SETTINGS_STORAGE_KEY = "settings";

type GlobalWithChromeStorage = typeof globalThis & {
  chrome?: {
    storage?: {
      sync?: ChromeStorageArea;
    };
  };
};

export class ChromeSettingsStore {
  public constructor(
    private readonly logger: Logger,
    private readonly storageArea: ChromeStorageArea | null = resolveSyncStorageArea()
  ) {}

  public async load(): Promise<FloatPlaySettings> {
    if (this.storageArea === null) {
      this.logger.warn("Chrome sync storage is unavailable; using default settings.");
      return { ...DEFAULT_SETTINGS };
    }

    try {
      const stored = await this.storageArea.get(SETTINGS_STORAGE_KEY);
      return normalizeSettings(stored[SETTINGS_STORAGE_KEY]);
    } catch (error) {
      this.logger.error("Unable to load FloatPlay settings; using defaults.", error);
      return { ...DEFAULT_SETTINGS };
    }
  }

  public async save(settings: FloatPlaySettings): Promise<void> {
    if (this.storageArea === null) {
      throw new Error("Chrome sync storage is unavailable.");
    }

    await this.storageArea.set({
      [SETTINGS_STORAGE_KEY]: normalizeSettings(settings)
    });
  }
}

function resolveSyncStorageArea(): ChromeStorageArea | null {
  return (globalThis as GlobalWithChromeStorage).chrome?.storage?.sync ?? null;
}
