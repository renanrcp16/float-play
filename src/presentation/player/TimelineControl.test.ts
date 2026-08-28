import { describe, expect, it } from "vitest";

import { resolveTimeDisplayActivation, shouldRefreshAfterSeek } from "./TimelineControl";

describe("resolveTimeDisplayActivation", () => {
  it("keeps a rendered live label bound to the live-edge action", () => {
    expect(resolveTimeDisplayActivation(true)).toBe("seek-live");
  });

  it("keeps regular video time displays bound to elapsed/remaining toggling", () => {
    expect(resolveTimeDisplayActivation(false)).toBe("toggle-display-mode");
  });
});

describe("shouldRefreshAfterSeek", () => {
  it("waits for the native YouTube live timeline after an accepted live seek", () => {
    expect(shouldRefreshAfterSeek({ didSeek: true, renderedLive: true })).toBe(false);
  });

  it("refreshes immediately for regular media or rejected seeks", () => {
    expect(shouldRefreshAfterSeek({ didSeek: true, renderedLive: false })).toBe(true);
    expect(shouldRefreshAfterSeek({ didSeek: false, renderedLive: true })).toBe(true);
  });
});
