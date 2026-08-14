import { FloatPlayController } from "./application/FloatPlayController";
import { ChromeI18n } from "./infrastructure/chrome/ChromeI18n";
import { DocumentPipManager } from "./infrastructure/pip/DocumentPipManager";
import { YouTubeAdapter } from "./infrastructure/youtube/YouTubeAdapter";
import { ConsoleLogger } from "./shared/Logger";

const logger = new ConsoleLogger(false);
const i18n = new ChromeI18n();
const youtube = new YouTubeAdapter();
const pip = new DocumentPipManager(logger);
const controller = new FloatPlayController(
  youtube,
  pip,
  {
    play: i18n.getMessage("playAction", "Play"),
    pause: i18n.getMessage("pauseAction", "Pause"),
    backward: i18n.getMessage("backwardAction", "Skip backward 10 seconds"),
    forward: i18n.getMessage("forwardAction", "Skip forward 10 seconds"),
    timeline: i18n.getMessage("timelineAction", "Playback timeline"),
    fit: i18n.getMessage("fitAction", "Fit to video"),
    speed: i18n.getMessage("speedAction", "Speed"),
    moreOptions: i18n.getMessage("moreOptionsAction", "More options"),
    volume: i18n.getMessage("volumeAction", "Volume"),
    mute: i18n.getMessage("muteAction", "Mute"),
    unmute: i18n.getMessage("unmuteAction", "Unmute")
  },
  logger
);

controller.start();
