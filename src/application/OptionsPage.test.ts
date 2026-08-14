import { describe, expect, it } from "vitest";

import {
  OPEN_OPTIONS_PAGE_MESSAGE,
  createOpenOptionsPageRequest,
  isOpenOptionsPageRequest,
  isOpenOptionsPageResponse
} from "./OptionsPage";

describe("OptionsPage messaging", () => {
  it("creates the canonical open request", () => {
    expect(createOpenOptionsPageRequest()).toEqual({
      type: OPEN_OPTIONS_PAGE_MESSAGE
    });
  });

  it("accepts only the canonical open request", () => {
    expect(isOpenOptionsPageRequest({ type: OPEN_OPTIONS_PAGE_MESSAGE })).toBe(true);
    expect(isOpenOptionsPageRequest({ type: "other" })).toBe(false);
    expect(isOpenOptionsPageRequest(null)).toBe(false);
  });

  it("accepts valid worker responses", () => {
    expect(isOpenOptionsPageResponse({ ok: true })).toBe(true);
    expect(isOpenOptionsPageResponse({ ok: false, error: "failed" })).toBe(true);
  });

  it("rejects invalid worker responses", () => {
    expect(isOpenOptionsPageResponse(undefined)).toBe(false);
    expect(isOpenOptionsPageResponse({ ok: "true" })).toBe(false);
    expect(isOpenOptionsPageResponse({ ok: false, error: 42 })).toBe(false);
  });
});
