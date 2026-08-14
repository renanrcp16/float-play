interface ChromeRuntimeApi {
  getURL(path: string): string;
}

type GlobalWithChromeRuntime = typeof globalThis & {
  chrome?: {
    runtime?: ChromeRuntimeApi;
  };
};

export class ChromeRuntime {
  public getUrl(path: string): string {
    const api = (globalThis as GlobalWithChromeRuntime).chrome?.runtime;

    if (api === undefined) {
      throw new Error("Chrome runtime API is unavailable.");
    }

    return api.getURL(path);
  }
}
