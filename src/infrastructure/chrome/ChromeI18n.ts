interface ChromeI18nApi {
  getMessage(messageName: string): string;
}

type GlobalWithChromeI18n = typeof globalThis & {
  chrome?: {
    i18n?: ChromeI18nApi;
  };
};

export class ChromeI18n {
  public getMessage(messageName: string, fallback: string): string {
    const api = (globalThis as GlobalWithChromeI18n).chrome?.i18n;
    const message = api?.getMessage(messageName) ?? "";

    return message.length > 0 ? message : fallback;
  }
}
