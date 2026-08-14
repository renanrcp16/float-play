export interface ControlVisibilityConfig {
  readonly enabled: boolean;
  readonly delayMs: number;
}

export interface ControlVisibilityState {
  readonly paused: boolean;
  readonly pointerOverControls: boolean;
  readonly interactiveFocus: boolean;
}

export const DEFAULT_CONTROL_VISIBILITY_CONFIG: ControlVisibilityConfig = {
  enabled: true,
  delayMs: 2500
};

export function normalizeControlVisibilityConfig(
  config: ControlVisibilityConfig
): ControlVisibilityConfig {
  return {
    enabled: config.enabled,
    delayMs:
      Number.isFinite(config.delayMs) && config.delayMs >= 0
        ? config.delayMs
        : DEFAULT_CONTROL_VISIBILITY_CONFIG.delayMs
  };
}

export function shouldKeepControlsVisible(
  config: ControlVisibilityConfig,
  state: ControlVisibilityState
): boolean {
  return (
    !config.enabled ||
    state.paused ||
    state.pointerOverControls ||
    state.interactiveFocus
  );
}
