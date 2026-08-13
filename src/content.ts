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
    pause: i18n.getMessage("pauseAction", "Pause")
  },
  logger
);

controller.start();
