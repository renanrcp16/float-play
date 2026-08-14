import type { OptionsPageLauncher } from "../../application/OptionsPage";

interface ChromeRuntimeApi {
  openOptionsPage(): Promise<void>;
}

type GlobalWithChromeRuntime = typeof globalThis & {
  chrome?: {
    runtime?: ChromeRuntimeApi;
  };
};

export class ChromeOptionsPage implements OptionsPageLauncher {
  public async open(): Promise<void> {
    const runtime = (globalThis as GlobalWithChromeRuntime).chrome?.runtime;

    if (runtime === undefined || typeof runtime.openOptionsPage !== "function") {
      throw new Error("Chrome options page API is unavailable.");
    }

    await runtime.openOptionsPage();
  }
}
