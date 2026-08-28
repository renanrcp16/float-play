import { describe, expect, it } from "vitest";

import { isYouTubeWatchTimelineMutation } from "./YouTubeAdapter";

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
