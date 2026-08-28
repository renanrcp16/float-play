import { describe, expect, it, vi } from "vitest";

import { isYouTubeWatchTimelineMutation, YouTubeAdapter } from "./YouTubeAdapter";

describe("isYouTubeWatchTimelineMutation", () => {
  it("accepts authoritative progress-coordinate updates from the YouTube watch slider", () => {
    for (const attributeName of ["aria-valuemin", "aria-valuemax", "aria-valuenow"] as const) {
      expect(isYouTubeWatchTimelineMutation(timelineMutation(attributeName, true))).toBe(true);
    }
  });

  it("ignores unrelated attributes and unrelated sliders", () => {
    expect(isYouTubeWatchTimelineMutation(timelineMutation("aria-valuetext", true))).toBe(false);
    expect(isYouTubeWatchTimelineMutation(timelineMutation("aria-valuenow", false))).toBe(false);
  });
});

describe("YouTubeAdapter.subscribeTimelineUpdates", () => {
  it("refreshes from native watch progress mutations and disconnects with the session", () => {
    let observerCallback: MutationCallback = () => undefined;
    const observe = vi.fn();
    const disconnect = vi.fn();

    class TestMutationObserver {
      public constructor(callback: MutationCallback) {
        observerCallback = callback;
      }

      public observe = observe;
      public disconnect = disconnect;
    }

    vi.stubGlobal("window", {
      location: {
        hostname: "www.youtube.com",
        pathname: "/watch"
      }
    });
    vi.stubGlobal("MutationObserver", TestMutationObserver);

    try {
      const adapter = new YouTubeAdapter();
      const lifecycle = new AbortController();
      const listener = vi.fn();
      const root = {} as ParentNode;

      adapter.subscribeTimelineUpdates(
        {} as HTMLVideoElement,
        listener,
        lifecycle.signal,
        root
      );

      expect(observe).toHaveBeenCalledWith(root, {
        attributes: true,
        subtree: true,
        attributeFilter: ["aria-valuemin", "aria-valuemax", "aria-valuenow"]
      });

      observerCallback(
        [timelineMutation("aria-valuenow", true) as MutationRecord],
        {} as MutationObserver
      );
      expect(listener).toHaveBeenCalledTimes(1);

      lifecycle.abort();
      expect(disconnect).toHaveBeenCalledTimes(1);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

function timelineMutation(attributeName: string, isWatchTimeline: boolean): Pick<
  MutationRecord,
  "type" | "target" | "attributeName"
> {
  const target = {
    matches: (selector: string) => isWatchTimeline && selector === ".ytp-progress-bar"
  } as unknown as Node;

  return {
    type: "attributes",
    target,
    attributeName
  };
}
