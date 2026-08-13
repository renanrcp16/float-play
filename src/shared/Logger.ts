export interface Logger {
  debug(message: string, context?: unknown): void;
  warn(message: string, context?: unknown): void;
  error(message: string, context?: unknown): void;
}

export class ConsoleLogger implements Logger {
  public constructor(private readonly debugEnabled: boolean) {}

  public debug(message: string, context?: unknown): void {
    if (!this.debugEnabled) {
      return;
    }

    this.write("debug", message, context);
  }

  public warn(message: string, context?: unknown): void {
    this.write("warn", message, context);
  }

  public error(message: string, context?: unknown): void {
    this.write("error", message, context);
  }

  private write(level: "debug" | "warn" | "error", message: string, context?: unknown): void {
    const prefix = `[FloatPlay] ${message}`;

    if (context === undefined) {
      console[level](prefix);
      return;
    }

    console[level](prefix, context);
  }
}
