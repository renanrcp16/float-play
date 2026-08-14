import { describe, expect, test } from "vitest";
import { adjustVolume, clampVolume } from "./MediaVolume";

describe("media volume rules", () => {
  test("clamps values to the media volume range", () => {
    expect(clampVolume(-0.2)).toBe(0);
    expect(clampVolume(0.45)).toBe(0.45);
    expect(clampVolume(1.4)).toBe(1);
  });

  test("uses the default five-percent adjustment step", () => {
    expect(adjustVolume(0.5, 1)).toBeCloseTo(0.55);
    expect(adjustVolume(0.5, -1)).toBeCloseTo(0.45);
  });

  test("does not exceed volume boundaries", () => {
    expect(adjustVolume(0.98, 1)).toBe(1);
    expect(adjustVolume(0.02, -1)).toBe(0);
  });
});
