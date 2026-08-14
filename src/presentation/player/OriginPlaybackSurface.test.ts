import { describe, expect, it } from "vitest";

import { isPointWithinBounds, shouldToggleFromOriginSurface } from "./OriginPlaybackSurface";

const bounds = {
  left: 100,
  top: 50,
  right: 500,
  bottom: 275
};

describe("isPointWithinBounds", () => {
  it("accepts points inside the original media bounds", () => {
    expect(isPointWithinBounds(250, 150, bounds)).toBe(true);
  });

  it("accepts points on the original media boundary", () => {
    expect(isPointWithinBounds(100, 50, bounds)).toBe(true);
    expect(isPointWithinBounds(500, 275, bounds)).toBe(true);
  });

  it("rejects points outside the original media bounds", () => {
    expect(isPointWithinBounds(99, 150, bounds)).toBe(false);
    expect(isPointWithinBounds(250, 276, bounds)).toBe(false);
  });

  it("rejects non-finite coordinates", () => {
    expect(isPointWithinBounds(Number.NaN, 150, bounds)).toBe(false);
    expect(isPointWithinBounds(250, Number.POSITIVE_INFINITY, bounds)).toBe(false);
  });
});

describe("shouldToggleFromOriginSurface", () => {
  it("accepts a primary click on the non-interactive video surface", () => {
    expect(
      shouldToggleFromOriginSurface({
        button: 0,
        x: 250,
        y: 150,
        bounds,
        interactiveTarget: false
      })
    ).toBe(true);
  });

  it("rejects clicks targeting interactive YouTube controls", () => {
    expect(
      shouldToggleFromOriginSurface({
        button: 0,
        x: 250,
        y: 150,
        bounds,
        interactiveTarget: true
      })
    ).toBe(false);
  });

  it("rejects non-primary clicks and clicks outside the video surface", () => {
    expect(
      shouldToggleFromOriginSurface({
        button: 1,
        x: 250,
        y: 150,
        bounds,
        interactiveTarget: false
      })
    ).toBe(false);
    expect(
      shouldToggleFromOriginSurface({
        button: 0,
        x: 50,
        y: 150,
        bounds,
        interactiveTarget: false
      })
    ).toBe(false);
  });
});
