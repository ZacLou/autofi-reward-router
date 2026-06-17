export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private level: LogLevel = LogLevel.INFO;

  setLevel(level: LogLevel) {
    this.level = level;
  }

  debug(msg: string, ...args: any[]) {
    if (this.level <= LogLevel.DEBUG) console.log(`[DEBUG] ${msg}`, ...args);
  }

  info(msg: string, ...args: any[]) {
    if (this.level <= LogLevel.INFO) console.log(`[INFO] ${msg}`, ...args);
  }

  warn(msg: string, ...args: any[]) {
    if (this.level <= LogLevel.WARN) console.warn(`[WARN] ${msg}`, ...args);
  }

  error(msg: string, err?: Error | string, ...args: any[]) {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[ERROR] ${msg}`, err instanceof Error ? err.message : err, ...args);
    }
  }
}

export const logger = new Logger();
