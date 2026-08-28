import { describe, expect, it } from "vitest";

import { resolveTimeDisplayActivation } from "./TimelineControl";

describe("resolveTimeDisplayActivation", () => {
  it("keeps a rendered live label bound to the live-edge action", () => {
    expect(resolveTimeDisplayActivation(true)).toBe("seek-live");
  });

  it("keeps regular video time displays bound to elapsed/remaining toggling", () => {
    expect(resolveTimeDisplayActivation(false)).toBe("toggle-display-mode");
  });
});
