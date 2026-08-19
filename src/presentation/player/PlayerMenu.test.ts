import { describe, expect, test } from "vitest";
import { eventPathHasCloseOverflowTarget } from "./PlayerMenu";

describe("PlayerMenu overflow close detection", () => {
  test("finds the close-marked menu item from the original event path", () => {
    const detachedChild = {
      matches: () => false
    } as unknown as EventTarget;
    const closeItem = {
      matches: (selector: string) => selector === '[data-floatplay-close-overflow="true"]'
    } as unknown as EventTarget;

    expect(eventPathHasCloseOverflowTarget([detachedChild, closeItem])).toBe(true);
  });

  test("ignores event paths without a close-marked menu item", () => {
    const regularTarget = {
      matches: () => false
    } as unknown as EventTarget;

    expect(eventPathHasCloseOverflowTarget([regularTarget])).toBe(false);
  });
});
