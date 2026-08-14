import { describe, expect, it } from "vitest";
import { calculateTriggerPosition } from "./SpikeTrigger";

describe("calculateTriggerPosition", () => {
  it("anchors the trigger inside the lower-right video area above native controls", () => {
    expect(
      calculateTriggerPosition(
        { right: 1000, bottom: 600 },
        { width: 1200, height: 800 }
      )
    ).toEqual({
      right: 216,
      bottom: 264
    });
  });

  it("keeps the configured insets when the video reaches the viewport edges", () => {
    expect(
      calculateTriggerPosition(
        { right: 1200, bottom: 800 },
        { width: 1200, height: 800 }
      )
    ).toEqual({
      right: 16,
      bottom: 64
    });
  });

  it("clamps video bounds that extend beyond the viewport", () => {
    expect(
      calculateTriggerPosition(
        { right: 1400, bottom: 900 },
        { width: 1200, height: 800 }
      )
    ).toEqual({
      right: 16,
      bottom: 64
    });
  });
});
