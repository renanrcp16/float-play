import { describe, expect, test } from "vitest";
import { getDisplayedVolume, resolveVolumeInput } from "./VolumeSemantics";

describe("volume semantics", () => {
  test("shows zero while muted without discarding the stored volume", () => {
    expect(getDisplayedVolume(0.45, true)).toBe(0);
    expect(getDisplayedVolume(0.45, false)).toBe(0.45);
  });

  test("mutes at zero while preserving the interaction start volume", () => {
    expect(resolveVolumeInput(0.01, 0, 0.45)).toEqual({
      volume: 0.45,
      muted: true
    });
  });

  test("positive input sets the requested volume and unmutes", () => {
    expect(resolveVolumeInput(0.45, 0.2, 0.45)).toEqual({
      volume: 0.2,
      muted: false
    });
  });
});
