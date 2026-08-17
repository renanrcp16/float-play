export type MediaRestoreStrategy = "placeholder" | "parent" | "unavailable";

export function chooseMediaRestoreStrategy(
  placeholderConnected: boolean,
  parentConnected: boolean
): MediaRestoreStrategy {
  if (placeholderConnected) {
    return "placeholder";
  }

  if (parentConnected) {
    return "parent";
  }

  return "unavailable";
}
