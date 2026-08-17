import { describe, expect, it } from "vitest";

import { chooseMediaRestoreStrategy } from "./MediaRestoreStrategy";

describe("PiP media restore strategy", () => {
  it("prefers the original placeholder when it is still connected", () => {
    expect(chooseMediaRestoreStrategy(true, true)).toBe("placeholder");
  });

  it("falls back to the original parent when the placeholder was removed", () => {
    expect(chooseMediaRestoreStrategy(false, true)).toBe("parent");
  });

  it("fails safely when neither original restoration location remains", () => {
    expect(chooseMediaRestoreStrategy(false, false)).toBe("unavailable");
  });
});
