import { describe, expect, it } from "vitest";

import {
  eventPathHasInteractiveElement,
  eventPathHasInteractiveElementBefore,
  INTERACTIVE_ELEMENT_SELECTOR,
  isInteractiveElementTarget
} from "./InteractiveElement";

function targetWithClosest(matches: boolean): EventTarget {
  return {
    closest: (selector: string) => {
      expect(selector).toBe(INTERACTIVE_ELEMENT_SELECTOR);
      return matches ? ({} as Element) : null;
    }
  } as unknown as EventTarget;
}

function targetWithMatches(matches: boolean, ariaHidden = false): EventTarget {
  return {
    matches: (selector: string) => {
      expect(selector).toBe(INTERACTIVE_ELEMENT_SELECTOR);
      return matches;
    },
    getAttribute: (name: string) => {
      expect(name).toBe("aria-hidden");
      return ariaHidden ? "true" : null;
    }
  } as unknown as EventTarget;
}

describe("interactive element semantics", () => {
  it("uses one conservative selector across presentation surfaces", () => {
    expect(INTERACTIVE_ELEMENT_SELECTOR).toContain("a,");
    expect(INTERACTIVE_ELEMENT_SELECTOR).toContain("button");
    expect(INTERACTIVE_ELEMENT_SELECTOR).toContain("summary");
    expect(INTERACTIVE_ELEMENT_SELECTOR).toContain("[tabindex]:not([tabindex='-1'])");
    expect(INTERACTIVE_ELEMENT_SELECTOR).toContain("[role='checkbox']");
    expect(INTERACTIVE_ELEMENT_SELECTOR).toContain("[role='slider']");
    expect(INTERACTIVE_ELEMENT_SELECTOR).toContain("[role='switch']");
  });

  it("detects a target inside an interactive ancestor", () => {
    expect(isInteractiveElementTarget(targetWithClosest(true))).toBe(true);
    expect(isInteractiveElementTarget(targetWithClosest(false))).toBe(false);
    expect(isInteractiveElementTarget(null)).toBe(false);
  });

  it("detects interactive entries in a composed event path", () => {
    expect(
      eventPathHasInteractiveElement([
        targetWithMatches(false),
        targetWithMatches(true),
        targetWithMatches(false)
      ])
    ).toBe(true);
    expect(eventPathHasInteractiveElement([targetWithMatches(false)])).toBe(false);
  });

  it("detects interactive controls before a resolved surface boundary", () => {
    const boundary = targetWithMatches(false);

    expect(
      eventPathHasInteractiveElementBefore(
        [targetWithMatches(false), targetWithMatches(true), boundary],
        boundary
      )
    ).toBe(true);
  });

  it("ignores aria-hidden interactive overlays before the surface boundary", () => {
    const boundary = targetWithMatches(false);

    expect(
      eventPathHasInteractiveElementBefore(
        [targetWithMatches(false), targetWithMatches(true, true), boundary],
        boundary
      )
    ).toBe(false);
  });

  it("ignores interactive descendants inside an aria-hidden overlay", () => {
    const boundary = targetWithMatches(false);

    expect(
      eventPathHasInteractiveElementBefore(
        [targetWithMatches(true), targetWithMatches(false, true), boundary],
        boundary
      )
    ).toBe(false);
  });

  it("ignores interactive semantics on the surface boundary and its ancestors", () => {
    const boundary = targetWithMatches(true);

    expect(
      eventPathHasInteractiveElementBefore(
        [targetWithMatches(false), boundary, targetWithMatches(true)],
        boundary
      )
    ).toBe(false);
  });
});
