import { describe, expect, test, vi } from "vitest";
import type { Logger } from "../../shared/Logger";
import { ChromeOnboardingStore } from "./ChromeOnboardingStore";
import type { OnboardingStorageArea } from "./ChromeOnboardingStore";

function createLogger() {
  return {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  } satisfies Logger;
}

describe("ChromeOnboardingStore", () => {
  test("treats a missing flag as unseen", async () => {
    const storage: OnboardingStorageArea = {
      get: vi.fn(() => Promise.resolve({})),
      set: vi.fn(() => Promise.resolve())
    };
    const store = new ChromeOnboardingStore(createLogger(), storage);

    await expect(store.hasSeenTriggerCoachmark()).resolves.toBe(false);
  });

  test("loads the persisted seen flag", async () => {
    const storage: OnboardingStorageArea = {
      get: vi.fn(() => Promise.resolve({ triggerCoachmarkSeen: true })),
      set: vi.fn(() => Promise.resolve())
    };
    const store = new ChromeOnboardingStore(createLogger(), storage);

    await expect(store.hasSeenTriggerCoachmark()).resolves.toBe(true);
  });

  test("skips onboarding when local storage is unavailable", async () => {
    const logger = createLogger();
    const store = new ChromeOnboardingStore(logger, null);

    await expect(store.hasSeenTriggerCoachmark()).resolves.toBe(true);
    expect(logger.warn).toHaveBeenCalledOnce();
  });

  test("skips onboarding when loading the flag fails", async () => {
    const logger = createLogger();
    const storage: OnboardingStorageArea = {
      get: vi.fn(() => Promise.reject(new Error("storage failure"))),
      set: vi.fn(() => Promise.resolve())
    };
    const store = new ChromeOnboardingStore(logger, storage);

    await expect(store.hasSeenTriggerCoachmark()).resolves.toBe(true);
    expect(logger.error).toHaveBeenCalledOnce();
  });

  test("marks the trigger coachmark as seen", async () => {
    const set = vi.fn(() => Promise.resolve());
    const storage: OnboardingStorageArea = {
      get: vi.fn(() => Promise.resolve({})),
      set
    };
    const store = new ChromeOnboardingStore(createLogger(), storage);

    await store.markTriggerCoachmarkSeen();

    expect(set).toHaveBeenCalledWith({ triggerCoachmarkSeen: true });
  });

  test("does not reject when persisting the seen flag fails", async () => {
    const logger = createLogger();
    const storage: OnboardingStorageArea = {
      get: vi.fn(() => Promise.resolve({})),
      set: vi.fn(() => Promise.reject(new Error("storage failure")))
    };
    const store = new ChromeOnboardingStore(logger, storage);

    await expect(store.markTriggerCoachmarkSeen()).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledOnce();
  });
});
