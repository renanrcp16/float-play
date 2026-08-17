export type SupportedLocale = "en" | "pt-BR";

export function resolveSupportedLocale(uiLanguage: string): SupportedLocale {
  const normalized = uiLanguage.trim().replaceAll("_", "-").toLowerCase();

  if (normalized === "pt-br") {
    return "pt-BR";
  }

  if (normalized === "en" || normalized.startsWith("en-")) {
    return "en";
  }

  return "en";
}
