import {
  isOpenOptionsPageRequest,
  type OpenOptionsPageResponse
} from "./application/OptionsPage";

interface ChromeRuntimeMessageEvent {
  addListener(
    listener: (
      message: unknown,
      sender: unknown,
      sendResponse: (response: OpenOptionsPageResponse) => void
    ) => boolean | void
  ): void;
}

interface ChromeRuntimeApi {
  readonly onMessage: ChromeRuntimeMessageEvent;
  openOptionsPage(): Promise<void>;
}

type GlobalWithChromeRuntime = typeof globalThis & {
  chrome?: {
    runtime?: ChromeRuntimeApi;
  };
};

const runtime = (globalThis as GlobalWithChromeRuntime).chrome?.runtime;

if (runtime !== undefined) {
  runtime.onMessage.addListener((message, sender, sendResponse) => {
    void sender;

    if (!isOpenOptionsPageRequest(message)) {
      return false;
    }

    void runtime.openOptionsPage().then(
      () => {
        sendResponse({ ok: true });
      },
      (error: unknown) => {
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : "Unable to open the FloatPlay options page."
        });
      }
    );

    return true;
  });
}
