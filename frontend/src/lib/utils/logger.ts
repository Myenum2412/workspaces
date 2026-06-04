type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

class Logger {
  private isDev = process.env.NODE_ENV !== "production";

  private format(entry: LogEntry): string {
    const base = `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`;
    if (entry.context && Object.keys(entry.context).length > 0) {
      return `${base} ${JSON.stringify(entry.context)}`;
    }
    return base;
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
    };

    // In dev, log everything. In prod, only warn+error to console.
    if (this.isDev) {
      switch (level) {
        case "debug": console.debug(this.format(entry)); break;
        case "info": console.info(this.format(entry)); break;
        case "warn": console.warn(this.format(entry)); break;
        case "error": console.error(this.format(entry)); break;
      }
    } else if (level === "error" || level === "warn") {
      // In production, still log to console but could also send to monitoring
      console[level](this.format(entry));
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log("debug", message, context);
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log("info", message, context);
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log("warn", message, context);
  }

  error(message: string, context?: Record<string, unknown>) {
    this.log("error", message, context);
  }
}

export const logger = new Logger();
