import { describe, expect, it } from "vitest";

import { shouldToggleFromPipVideoClick } from "./PipPlaybackSurface";

describe("shouldToggleFromPipVideoClick", () => {
  it("accepts a primary click when the preference is enabled", () => {
    expect(shouldToggleFromPipVideoClick({ enabled: true, button: 0 })).toBe(true);
  });

  it("rejects clicks when the preference is disabled", () => {
    expect(shouldToggleFromPipVideoClick({ enabled: false, button: 0 })).toBe(false);
  });

  it("rejects non-primary clicks", () => {
    expect(shouldToggleFromPipVideoClick({ enabled: true, button: 1 })).toBe(false);
    expect(shouldToggleFromPipVideoClick({ enabled: true, button: 2 })).toBe(false);
  });
});
