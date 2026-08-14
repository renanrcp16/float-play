export class CurrentVideoDismissal {
  private dismissedVideoId: string | null = null;

  public reconcile(currentVideoId: string | null): void {
    if (this.dismissedVideoId !== null && this.dismissedVideoId !== currentVideoId) {
      this.dismissedVideoId = null;
    }
  }

  public dismiss(currentVideoId: string | null): void {
    this.dismissedVideoId = currentVideoId;
  }

  public isDismissed(currentVideoId: string | null): boolean {
    return currentVideoId !== null && this.dismissedVideoId === currentVideoId;
  }
}
