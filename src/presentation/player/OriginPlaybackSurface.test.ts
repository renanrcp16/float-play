import { describe, expect, it } from "vitest";

import { isPointWithinBounds, shouldToggleFromOriginSurface } from "./OriginPlaybackSurface";

const bounds = {
  left: 100,
  top: 50,
  right: 500,
  bottom: 275
};

describe("isPointWithinBounds", () => {
  it("accepts points inside the current origin bounds", () => {
    expect(isPointWithinBounds(250, 150, bounds)).toBe(true);
  });

  it("accepts points on the current origin boundary", () => {
    expect(isPointWithinBounds(100, 50, bounds)).toBe(true);
    expect(isPointWithinBounds(500, 275, bounds)).toBe(true);
  });

  it("rejects points outside the current origin bounds", () => {
    expect(isPointWithinBounds(99, 150, bounds)).toBe(false);
    expect(isPointWithinBounds(250, 276, bounds)).toBe(false);
  });

  it("rejects invalid coordinates or bounds", () => {
    expect(isPointWithinBounds(Number.NaN, 150, bounds)).toBe(false);
    expect(isPointWithinBounds(250, Number.POSITIVE_INFINITY, bounds)).toBe(false);
    expect(
      isPointWithinBounds(250, 150, {
        left: 500,
        top: 50,
        right: 100,
        bottom: 275
      })
    ).toBe(false);
  });
});

describe("shouldToggleFromOriginSurface", () => {
  it("accepts a primary click on the current non-interactive origin surface", () => {
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

  it("rejects clicks when the current origin surface is unavailable", () => {
    expect(
      shouldToggleFromOriginSurface({
        button: 0,
        x: 250,
        y: 150,
        bounds: null,
        interactiveTarget: false
      })
    ).toBe(false);
  });

  it("rejects a point that belonged to stale bounds after the origin moved", () => {
    const movedBounds = {
      left: 600,
      top: 300,
      right: 1000,
      bottom: 525
    };

    expect(
      shouldToggleFromOriginSurface({
        button: 0,
        x: 250,
        y: 150,
        bounds: movedBounds,
        interactiveTarget: false
      })
    ).toBe(false);
    expect(
      shouldToggleFromOriginSurface({
        button: 0,
        x: 750,
        y: 400,
        bounds: movedBounds,
        interactiveTarget: false
      })
    ).toBe(true);
  });

  it("rejects non-primary clicks and clicks outside the current surface", () => {
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
