import { describe, expect, it } from "vitest";

import { resolveSupportedLocale } from "./SupportedLocale";

describe("supported locale resolution", () => {
  it.each(["pt-BR", "pt_br", "PT-BR"])("uses Brazilian Portuguese for %s", (uiLanguage) => {
    expect(resolveSupportedLocale(uiLanguage)).toBe("pt-BR");
  });

  it.each(["en", "en-US", "en-GB", "EN_us"])("uses English for %s", (uiLanguage) => {
    expect(resolveSupportedLocale(uiLanguage)).toBe("en");
  });

  it.each(["fr-FR", "pt-PT", "es-ES", "", "   "])("falls back to English for unsupported locale %s", (uiLanguage) => {
    expect(resolveSupportedLocale(uiLanguage)).toBe("en");
  });
});
