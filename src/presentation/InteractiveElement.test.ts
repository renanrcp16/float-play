import { describe, expect, it } from "vitest";

import {
  eventPathHasInteractiveElement,
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

function targetWithMatches(matches: boolean): EventTarget {
  return {
    matches: (selector: string) => {
      expect(selector).toBe(INTERACTIVE_ELEMENT_SELECTOR);
      return matches;
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
});
