import { SpikeController } from "./application/SpikeController";
import { DocumentPipManager } from "./infrastructure/pip/DocumentPipManager";
import { YouTubeAdapter } from "./infrastructure/youtube/YouTubeAdapter";
import { ConsoleLogger } from "./shared/Logger";

const logger = new ConsoleLogger(false);
const youtube = new YouTubeAdapter();
const pip = new DocumentPipManager(logger);
const controller = new SpikeController(youtube, pip, logger);

controller.start();
