import type { Logger } from "../../shared/Logger";
import type { ChromeStorageArea } from "./ChromeStorageArea";

const TRIGGER_COACHMARK_SEEN_KEY = "triggerCoachmarkSeen";

type GlobalWithChromeLocalStorage = typeof globalThis & {
  chrome?: {
    storage?: {
      local?: ChromeStorageArea;
    };
  };
};

export class ChromeOnboardingStore {
  public constructor(
    private readonly logger: Logger,
    private readonly storageArea: ChromeStorageArea | null = resolveLocalStorageArea()
  ) {}

  public async hasSeenTriggerCoachmark(): Promise<boolean> {
    if (this.storageArea === null) {
      this.logger.warn("Chrome local storage is unavailable; skipping FloatPlay onboarding.");
      return true;
    }

    try {
      const stored = await this.storageArea.get(TRIGGER_COACHMARK_SEEN_KEY);
      return stored[TRIGGER_COACHMARK_SEEN_KEY] === true;
    } catch (error) {
      this.logger.error("Unable to load FloatPlay onboarding state; skipping onboarding.", error);
      return true;
    }
  }

  public async markTriggerCoachmarkSeen(): Promise<void> {
    if (this.storageArea === null) {
      return;
    }

    try {
      await this.storageArea.set({
        [TRIGGER_COACHMARK_SEEN_KEY]: true
      });
    } catch (error) {
      this.logger.error("Unable to persist FloatPlay onboarding state.", error);
    }
  }
}

function resolveLocalStorageArea(): ChromeStorageArea | null {
  return (globalThis as GlobalWithChromeLocalStorage).chrome?.storage?.local ?? null;
}
