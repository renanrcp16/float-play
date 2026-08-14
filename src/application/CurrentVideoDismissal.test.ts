import { describe, expect, it } from "vitest";
import { CurrentVideoDismissal } from "./CurrentVideoDismissal";

describe("CurrentVideoDismissal", () => {
  it("keeps the trigger dismissed for the current video", () => {
    const dismissal = new CurrentVideoDismissal();

    dismissal.dismiss("video-a");
    dismissal.reconcile("video-a");

    expect(dismissal.isDismissed("video-a")).toBe(true);
  });

  it("clears dismissal when navigation reaches a different video", () => {
    const dismissal = new CurrentVideoDismissal();

    dismissal.dismiss("video-a");
    dismissal.reconcile("video-b");

    expect(dismissal.isDismissed("video-b")).toBe(false);
    expect(dismissal.isDismissed("video-a")).toBe(false);
  });

  it("does not persist a dismissal without a current video identity", () => {
    const dismissal = new CurrentVideoDismissal();

    dismissal.dismiss(null);

    expect(dismissal.isDismissed(null)).toBe(false);
  });
});
