import { describe, expect, it } from "vitest";

import {
  isPointWithinBounds,
  resolveOriginClickSurface,
  shouldShowPointerFromOriginSurface,
  shouldToggleFromOriginSurface
} from "./OriginPlaybackSurface";

const bounds = {
  left: 100,
  top: 50,
  right: 500,
  bottom: 275
};

function elementWithBounds(
  currentBounds: typeof bounds,
  parentElement: HTMLElement | null = null,
  isConnected = true
): HTMLElement {
  return {
    isConnected,
    parentElement,
    getBoundingClientRect: () => ({
      ...currentBounds,
      width: currentBounds.right - currentBounds.left,
      height: currentBounds.bottom - currentBounds.top,
      x: currentBounds.left,
      y: currentBounds.top,
      toJSON: () => ({})
    })
  } as unknown as HTMLElement;
}

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

describe("resolveOriginClickSurface", () => {
  it("uses the current origin element when it is on the click path", () => {
    const origin = elementWithBounds(bounds);

    expect(resolveOriginClickSurface(origin, [origin])).toEqual({
      element: origin,
      bounds
    });
  });

  it("falls back to the first valid shared ancestor when an overlay receives the click", () => {
    const playerBounds = {
      left: 20,
      top: 10,
      right: 1020,
      bottom: 570
    };
    const player = elementWithBounds(playerBounds);
    const origin = elementWithBounds(
      {
        left: 100,
        top: 100,
        right: 100,
        bottom: 100
      },
      player
    );
    const overlay = {} as EventTarget;

    expect(resolveOriginClickSurface(origin, [overlay, player])).toEqual({
      element: player,
      bounds: playerBounds
    });
  });

  it("fails closed when no connected ancestor with valid current bounds is on the click path", () => {
    const player = elementWithBounds(bounds);
    const origin = elementWithBounds(bounds, player, false);

    expect(resolveOriginClickSurface(origin, [player])).toBeNull();
  });
});

describe("shouldShowPointerFromOriginSurface", () => {
  it("shows a pointer over the eligible non-interactive origin surface", () => {
    expect(
      shouldShowPointerFromOriginSurface({
        x: 250,
        y: 150,
        bounds,
        interactiveTarget: false
      })
    ).toBe(true);
  });

  it("keeps native cursor semantics over controls and outside the surface", () => {
    expect(
      shouldShowPointerFromOriginSurface({
        x: 250,
        y: 150,
        bounds,
        interactiveTarget: true
      })
    ).toBe(false);
    expect(
      shouldShowPointerFromOriginSurface({
        x: 50,
        y: 150,
        bounds,
        interactiveTarget: false
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

  it("accepts clicks after hidden overlay filtering resolves them as non-interactive", () => {
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
