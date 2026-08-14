export interface OptionsPageLauncher {
  open(): Promise<void>;
}

export const OPEN_OPTIONS_PAGE_MESSAGE = "floatplay:open-options-page";

export interface OpenOptionsPageRequest {
  readonly type: typeof OPEN_OPTIONS_PAGE_MESSAGE;
}

export interface OpenOptionsPageResponse {
  readonly ok: boolean;
  readonly error?: string;
}

export function createOpenOptionsPageRequest(): OpenOptionsPageRequest {
  return {
    type: OPEN_OPTIONS_PAGE_MESSAGE
  };
}

export function isOpenOptionsPageRequest(value: unknown): value is OpenOptionsPageRequest {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return (value as { readonly type?: unknown }).type === OPEN_OPTIONS_PAGE_MESSAGE;
}

export function isOpenOptionsPageResponse(value: unknown): value is OpenOptionsPageResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const response = value as {
    readonly ok?: unknown;
    readonly error?: unknown;
  };

  return (
    typeof response.ok === "boolean" &&
    (response.error === undefined || typeof response.error === "string")
  );
}
