import {
  DEFAULT_SETTINGS,
  SETTINGS_SCHEMA_VERSION,
  normalizeSettings,
  type FloatPlaySettings,
  type FloatPlaySettingsPatch
} from "../../application/Settings";
import type { Logger } from "../../shared/Logger";
import type { ChromeStorageArea } from "./ChromeStorageArea";

const SETTINGS_STORAGE_KEYS = {
  schemaVersion: "settings.v1.schemaVersion",
  seekBackwardSeconds: "settings.v1.seekBackwardSeconds",
  seekForwardSeconds: "settings.v1.seekForwardSeconds",
  volumeStep: "settings.v1.volumeStep",
  autoHideEnabled: "settings.v1.autoHideEnabled",
  autoHideDelayMs: "settings.v1.autoHideDelayMs",
  timeDisplayMode: "settings.v1.timeDisplayMode",
  pipVideoClickTogglesPlayback: "settings.v1.pipVideoClickTogglesPlayback"
} as const satisfies Record<keyof FloatPlaySettings, string>;
const SETTINGS_STORAGE_READ_KEYS = Object.values(SETTINGS_STORAGE_KEYS);

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
      const stored = await this.storageArea.get(SETTINGS_STORAGE_READ_KEYS);

      if (stored[SETTINGS_STORAGE_KEYS.schemaVersion] !== SETTINGS_SCHEMA_VERSION) {
        return { ...DEFAULT_SETTINGS };
      }

      return normalizeSettings({
        schemaVersion: SETTINGS_SCHEMA_VERSION,
        seekBackwardSeconds: stored[SETTINGS_STORAGE_KEYS.seekBackwardSeconds],
        seekForwardSeconds: stored[SETTINGS_STORAGE_KEYS.seekForwardSeconds],
        volumeStep: stored[SETTINGS_STORAGE_KEYS.volumeStep],
        autoHideEnabled: stored[SETTINGS_STORAGE_KEYS.autoHideEnabled],
        autoHideDelayMs: stored[SETTINGS_STORAGE_KEYS.autoHideDelayMs],
        timeDisplayMode: stored[SETTINGS_STORAGE_KEYS.timeDisplayMode],
        pipVideoClickTogglesPlayback: stored[SETTINGS_STORAGE_KEYS.pipVideoClickTogglesPlayback]
      });
    } catch (error) {
      this.logger.error("Unable to load FloatPlay settings; using defaults.", error);
      return { ...DEFAULT_SETTINGS };
    }
  }

  public async update(patch: FloatPlaySettingsPatch): Promise<void> {
    if (this.storageArea === null) {
      throw new Error("Chrome sync storage is unavailable.");
    }

    const normalized = normalizeSettings({
      ...DEFAULT_SETTINGS,
      ...patch,
      schemaVersion: SETTINGS_SCHEMA_VERSION
    });
    const items: Record<string, unknown> = {
      [SETTINGS_STORAGE_KEYS.schemaVersion]: SETTINGS_SCHEMA_VERSION
    };

    if (patch.seekBackwardSeconds !== undefined) {
      items[SETTINGS_STORAGE_KEYS.seekBackwardSeconds] = normalized.seekBackwardSeconds;
    }

    if (patch.seekForwardSeconds !== undefined) {
      items[SETTINGS_STORAGE_KEYS.seekForwardSeconds] = normalized.seekForwardSeconds;
    }

    if (patch.volumeStep !== undefined) {
      items[SETTINGS_STORAGE_KEYS.volumeStep] = normalized.volumeStep;
    }

    if (patch.autoHideEnabled !== undefined) {
      items[SETTINGS_STORAGE_KEYS.autoHideEnabled] = normalized.autoHideEnabled;
    }

    if (patch.autoHideDelayMs !== undefined) {
      items[SETTINGS_STORAGE_KEYS.autoHideDelayMs] = normalized.autoHideDelayMs;
    }

    if (patch.timeDisplayMode !== undefined) {
      items[SETTINGS_STORAGE_KEYS.timeDisplayMode] = normalized.timeDisplayMode;
    }

    if (patch.pipVideoClickTogglesPlayback !== undefined) {
      items[SETTINGS_STORAGE_KEYS.pipVideoClickTogglesPlayback] = normalized.pipVideoClickTogglesPlayback;
    }

    await this.storageArea.set(items);
  }
}

function resolveSyncStorageArea(): ChromeStorageArea | null {
  return (globalThis as GlobalWithChromeStorage).chrome?.storage?.sync ?? null;
}
