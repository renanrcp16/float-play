import { describe, expect, it } from "vitest";

import {
  hasLiveSeekReconciled,
  resolvePendingLiveSeekCurrent,
  resolveTimeDisplayActivation
} from "./TimelineControl";

const liveState = {
  start: 15_109_468,
  end: 15_152_653,
  safeEnd: 15_152_653,
  current: 15_150_000
};

describe("resolveTimeDisplayActivation", () => {
  it("keeps a rendered live label bound to the live-edge action", () => {
    expect(resolveTimeDisplayActivation(true)).toBe("seek-live");
  });

  it("keeps regular video time displays bound to elapsed/remaining toggling", () => {
    expect(resolveTimeDisplayActivation(false)).toBe("toggle-display-mode");
  });
});

describe("resolvePendingLiveSeekCurrent", () => {
  it("renders the selected live target immediately while YouTube still exposes the old native coordinate", () => {
    expect(
      resolvePendingLiveSeekCurrent(
        liveState,
        {
          target: 15_120_000,
          anchorMediaTime: null
        },
        46_901
      )
    ).toBe(15_120_000);
  });

  it("keeps a stale native coordinate from overwriting the selected live target before seeked", () => {
    const displayedCurrent = resolvePendingLiveSeekCurrent(
      { ...liveState, current: 15_150_000 },
      {
        target: 15_120_000,
        anchorMediaTime: null
      },
      46_902
    );

    expect(displayedCurrent).toBe(15_120_000);
    expect(hasLiveSeekReconciled(15_150_000, displayedCurrent)).toBe(false);
  });

  it("advances from the selected live target using media-time deltas after seeked anchors the media clock", () => {
    expect(
      resolvePendingLiveSeekCurrent(
        liveState,
        {
          target: 15_120_000,
          anchorMediaTime: 8_000
        },
        8_005.5
      )
    ).toBe(15_120_005.5);
  });

  it("clamps an optimistic live target to the current DVR window", () => {
    expect(
      resolvePendingLiveSeekCurrent(
        liveState,
        {
          target: liveState.end,
          anchorMediaTime: 8_000
        },
        8_010
      )
    ).toBe(liveState.end);
  });

  it("uses the authoritative coordinate when no live seek is pending", () => {
    expect(resolvePendingLiveSeekCurrent(liveState, null, 8_000)).toBe(liveState.current);
  });
});

describe("hasLiveSeekReconciled", () => {
  it("accepts the native timeline once it catches the displayed pending position", () => {
    expect(hasLiveSeekReconciled(15_120_001, 15_120_000)).toBe(true);
  });

  it("keeps the pending position while YouTube still exposes a stale coordinate", () => {
    expect(hasLiveSeekReconciled(15_150_000, 15_120_000)).toBe(false);
  });
});
