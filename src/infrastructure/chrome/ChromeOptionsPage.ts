import {
  createOpenOptionsPageRequest,
  isOpenOptionsPageResponse,
  type OptionsPageLauncher
} from "../../application/OptionsPage";

interface ChromeRuntimeApi {
  sendMessage(message: unknown): Promise<unknown>;
}

type GlobalWithChromeRuntime = typeof globalThis & {
  chrome?: {
    runtime?: ChromeRuntimeApi;
  };
};

export class ChromeOptionsPage implements OptionsPageLauncher {
  public async open(): Promise<void> {
    const runtime = (globalThis as GlobalWithChromeRuntime).chrome?.runtime;

    if (runtime === undefined || typeof runtime.sendMessage !== "function") {
      throw new Error("Chrome runtime messaging API is unavailable.");
    }

    const response = await runtime.sendMessage(createOpenOptionsPageRequest());

    if (!isOpenOptionsPageResponse(response)) {
      throw new Error("The FloatPlay service worker returned an invalid options page response.");
    }

    if (!response.ok) {
      throw new Error(response.error ?? "Unable to open the FloatPlay options page.");
    }
  }
}
