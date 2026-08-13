import { PLAYER_BASE_STYLES } from "./styles/PlayerBaseStyles";
import { PLAYER_CONTROL_STYLES } from "./styles/PlayerControlStyles";

export function installPlayerShellStyles(document: Document): void {
  const style = document.createElement("style");
  style.dataset.floatplay = "player-shell-styles";
  style.textContent = `${PLAYER_BASE_STYLES}${PLAYER_CONTROL_STYLES}`;
  document.head.append(style);
}
