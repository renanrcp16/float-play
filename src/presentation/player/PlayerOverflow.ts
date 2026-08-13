import type { Logger } from "../../shared/Logger";
import { createFitMenuItem } from "./FitMenuItem";
import { OverflowMenu } from "./OverflowMenu";

export class PlayerOverflow {
  public constructor(
    private readonly media: HTMLVideoElement,
    private readonly playerWindow: Window,
    private readonly signal: AbortSignal,
    private readonly fitLabel: string,
    private readonly moreOptionsLabel: string,
    private readonly logger: Logger
  ) {}

  public mount(): void {
    const row = this.playerWindow.document.querySelector<HTMLElement>(".floatplay-button-row");
    if (row === null) return;

    const fitItem = createFitMenuItem(
      this.playerWindow.document,
      this.media,
      this.playerWindow,
      this.fitLabel,
      this.signal,
      this.logger
    );
    const menu = new OverflowMenu(
      this.playerWindow.document,
      this.signal,
      this.moreOptionsLabel,
      [fitItem]
    ).create();

    row.append(menu);
  }
}
