export const PLAYER_BASE_STYLES = `
.floatplay-player-shell { position: relative; width: 100%; height: 100%; overflow: hidden; background: #000; }
.floatplay-player-shell > video { display: block; width: 100% !important; height: 100% !important; max-width: none !important; max-height: none !important; object-fit: contain !important; }
.floatplay-controls { position: absolute; right: 0; bottom: 0; left: 0; display: flex; flex-direction: column; gap: 8px; padding: 12px; pointer-events: none; }
.floatplay-button-row { display: flex; align-items: center; justify-content: center; width: 100%; min-height: 28px; gap: 8px; }
`;
