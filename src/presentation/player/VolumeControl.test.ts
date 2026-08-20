import { describe, expect, it } from "vitest";
import {
  COMPACT_VOLUME_MAX_WIDTH,
  resolveVolumeControlLayout
} from "./VolumeControl";

describe("resolveVolumeControlLayout", () => {
  it("uses the compact layout at the supported small PiP width", () => {
    expect(resolveVolumeControlLayout(250)).toBe("compact");
    expect(resolveVolumeControlLayout(COMPACT_VOLUME_MAX_WIDTH)).toBe("compact");
  });

  it("uses the inline layout when there is enough horizontal room", () => {
    expect(resolveVolumeControlLayout(COMPACT_VOLUME_MAX_WIDTH + 1)).toBe("inline");
    expect(resolveVolumeControlLayout(640)).toBe("inline");
  });

  it("fails open to the normal inline layout for invalid geometry", () => {
    expect(resolveVolumeControlLayout(Number.NaN)).toBe("inline");
    expect(resolveVolumeControlLayout(Number.POSITIVE_INFINITY)).toBe("inline");
  });
});
