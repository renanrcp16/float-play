import { describe, expect, it } from "vitest";
import { resolveAudioOnlyPolicy } from "./AudioOnlyPolicy";

describe("resolveAudioOnlyPolicy", () => {
  it("follows the saved preference on regular YouTube", () => {
    expect(resolveAudioOnlyPolicy(false, false)).toEqual({
      enabled: false,
      toggleVisible: true
    });
    expect(resolveAudioOnlyPolicy(true, false)).toEqual({
      enabled: true,
      toggleVisible: true
    });
  });

  it("forces Audio-only and hides its toggle when the site requires it", () => {
    expect(resolveAudioOnlyPolicy(false, true)).toEqual({
      enabled: true,
      toggleVisible: false
    });
    expect(resolveAudioOnlyPolicy(true, true)).toEqual({
      enabled: true,
      toggleVisible: false
    });
  });
});
