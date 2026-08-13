import { describe, expect, it } from "vitest";

import { calculateAspectAdjustment } from "./PipAspectFit";

describe("calculateAspectAdjustment", () => {
  it("removes the observed extra width for 16:9 media", () => {
    expect(calculateAspectAdjustment(526, 288, 2560, 1440)).toEqual({ width: -14, height: 0 });
  });

  it("does nothing when the viewport already matches the media ratio", () => {
    expect(calculateAspectAdjustment(480, 270, 1920, 1080)).toEqual({ width: 0, height: 0 });
  });

  it("chooses the smaller axis adjustment", () => {
    expect(calculateAspectAdjustment(480, 300, 1920, 1080)).toEqual({ width: 0, height: -30 });
  });

  it("returns null for invalid geometry", () => {
    expect(calculateAspectAdjustment(0, 270, 1920, 1080)).toBeNull();
  });
});
