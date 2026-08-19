export interface AudioOnlyPolicy {
  readonly enabled: boolean;
  readonly toggleVisible: boolean;
}

export function resolveAudioOnlyPolicy(
  preferredEnabled: boolean,
  required: boolean
): AudioOnlyPolicy {
  return {
    enabled: required || preferredEnabled,
    toggleVisible: !required
  };
}
