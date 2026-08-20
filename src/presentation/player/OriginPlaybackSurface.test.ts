import { describe, expect, it } from "vitest";

import {
  isPointWithinBounds,
  resolveOriginClickSurface,
  shouldToggleFromOriginSurface
} from "./OriginPlaybackSurface";

const bounds = {
  left: 100,
  top: 50,
  right: 500,
  bottom: 275
};

function surfaceElement(
  elementBounds: typeof bounds,
  parentElement: HTMLElement | null = null,
  isConnected = true
): HTMLElement {
  return {
    isConnected,
    parentElement,
    getBoundingClientRect: () => ({
      ...elementBounds,
      width: elementBounds.right - elementBounds.left,
      height: elementBounds.bottom - elementBounds.top
    })
  } as unknown as HTMLElement;
}

describe("resolveOriginClickSurface", () => {
  it("uses the current origin element when it belongs to the click path", () => {
    const origin = surfaceElement(bounds);

    expect(resolveOriginClickSurface(origin, [origin])).toEqual({
      element: origin,
      bounds
    });
  });

  it("climbs to the first current ancestor shared with an overlay click path", () => {
    const playerBounds = {
      left: 80,
      top: 30,
      right: 520,
      bottom: 300
    };
    const player = surfaceElement(playerBounds);
    const origin = surfaceElement(bounds, player);
    const overlay = {} as EventTarget;

    expect(resolveOriginClickSurface(origin, [overlay, player])).toEqual({
      element: player,
      bounds: playerBounds
    });
  });

  it("skips collapsed origin geometry and uses a valid shared ancestor", () => {
    const player = surfaceElement(bounds);
    const collapsed = surfaceElement(
      {
        left: 100,
        top: 50,
        right: 100,
        bottom: 50
      },
      player
    );

    expect(resolveOriginClickSurface(collapsed, [collapsed, player])).toEqual({
      element: player,
      bounds
    });
  });

  it("fails closed when the original container is disconnected", () => {
    const origin = surfaceElement(bounds, null, false);

    expect(resolveOriginClickSurface(origin, [origin])).toBeNull();
  });
});

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
