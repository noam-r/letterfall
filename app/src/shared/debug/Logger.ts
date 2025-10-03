export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4,
} as const;

export type LogLevel = typeof LogLevel[keyof typeof LogLevel];

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  stack?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableStorage: boolean;
  maxStorageEntries: number;
  categories: string[];
  enableStackTrace: boolean;
}

export class Logger {
  private static instance: Logger | null = null;
  private config: LoggerConfig;
  private entries: LogEntry[] = [];
  private listeners: ((entry: LogEntry) => void)[] = [];

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.WARN,
      enableConsole: true,
      enableStorage: true,
      maxStorageEntries: 1000,
      categories: [],
      enableStackTrace: import.meta.env.DEV,
      ...config,
    };

    this.loadStoredEntries();
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Configure logger settings
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Add a log listener
   */
  addListener(listener: (entry: LogEntry) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remove a log listener
   */
  removeListener(listener: (entry: LogEntry) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Log a debug message
   */
  debug(category: string, message: string, data?: any): void {
    this.log(LogLevel.DEBUG, category, message, data);
  }

  /**
   * Log an info message
   */
  info(category: string, message: string, data?: any): void {
    this.log(LogLevel.INFO, category, message, data);
  }

  /**
   * Log a warning message
   */
  warn(category: string, message: string, data?: any): void {
    this.log(LogLevel.WARN, category, message, data);
  }

  /**
   * Log an error message
   */
  error(category: string, message: string, data?: any): void {
    this.log(LogLevel.ERROR, category, message, data);
  }

  /**
   * Log a message with specified level
   */
  log(level: LogLevel, category: string, message: string, data?: any): void {
    // Check if logging is enabled for this level
    if (level < this.config.level) {
      return;
    }

    // Check if category is filtered
    if (this.config.categories.length > 0 && !this.config.categories.includes(category)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      category,
      message,
      data,
    };

    // Add stack trace for errors or if enabled
    if (level === LogLevel.ERROR || this.config.enableStackTrace) {
      entry.stack = new Error().stack;
    }

    this.addEntry(entry);
  }

  /**
   * Get all log entries
   */
  getEntries(): LogEntry[] {
    return [...this.entries];
  }

  /**
   * Get entries filtered by criteria
   */
  getFilteredEntries(filter: {
    level?: LogLevel;
    category?: string;
    since?: number;
    limit?: number;
  }): LogEntry[] {
    let filtered = this.entries;

    if (filter.level !== undefined) {
      filtered = filtered.filter(entry => entry.level >= filter.level!);
    }

    if (filter.category) {
      filtered = filtered.filter(entry => entry.category === filter.category);
    }

    if (filter.since) {
      filtered = filtered.filter(entry => entry.timestamp >= filter.since!);
    }

    if (filter.limit) {
      filtered = filtered.slice(-filter.limit);
    }

    return filtered;
  }

  /**
   * Clear all log entries
   */
  clear(): void {
    this.entries = [];
    this.saveEntriesToStorage();
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify({
      config: this.config,
      entries: this.entries,
      exportedAt: Date.now(),
    }, null, 2);
  }

  /**
   * Import logs from JSON
   */
  importLogs(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);
      if (data.entries && Array.isArray(data.entries)) {
        this.entries = data.entries;
        this.saveEntriesToStorage();
      }
    } catch (error) {
      this.error('Logger', 'Failed to import logs', error);
    }
  }

  /**
   * Get log statistics
   */
  getStats(): {
    totalEntries: number;
    entriesByLevel: Record<string, number>;
    entriesByCategory: Record<string, number>;
    oldestEntry?: number;
    newestEntry?: number;
  } {
    const stats = {
      totalEntries: this.entries.length,
      entriesByLevel: {} as Record<string, number>,
      entriesByCategory: {} as Record<string, number>,
      oldestEntry: undefined as number | undefined,
      newestEntry: undefined as number | undefined,
    };

    if (this.entries.length > 0) {
      stats.oldestEntry = this.entries[0].timestamp;
      stats.newestEntry = this.entries[this.entries.length - 1].timestamp;
    }

    this.entries.forEach(entry => {
      const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'NONE'];
      const levelName = levelNames[entry.level] || 'UNKNOWN';
      stats.entriesByLevel[levelName] = (stats.entriesByLevel[levelName] || 0) + 1;
      stats.entriesByCategory[entry.category] = (stats.entriesByCategory[entry.category] || 0) + 1;
    });

    return stats;
  }

  private addEntry(entry: LogEntry): void {
    this.entries.push(entry);

    // Limit storage size
    if (this.entries.length > this.config.maxStorageEntries) {
      this.entries = this.entries.slice(-this.config.maxStorageEntries);
    }

    // Console output
    if (this.config.enableConsole) {
      this.outputToConsole(entry);
    }

    // Storage
    if (this.config.enableStorage) {
      this.saveEntriesToStorage();
    }

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(entry);
      } catch (error) {
        console.error('Logger listener error:', error);
      }
    });
  }

  private outputToConsole(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString();
    const prefix = `[${timestamp}] [${entry.category}]`;
    
    const consoleMethod = this.getConsoleMethod(entry.level);
    
    if (entry.data) {
      consoleMethod(`${prefix} ${entry.message}`, entry.data);
    } else {
      consoleMethod(`${prefix} ${entry.message}`);
    }

    if (entry.stack && entry.level === LogLevel.ERROR) {
      console.error(entry.stack);
    }
  }

  private getConsoleMethod(level: LogLevel): (...args: any[]) => void {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
        return console.error;
      default:
        return console.log;
    }
  }

  private saveEntriesToStorage(): void {
    try {
      const data = {
        entries: this.entries.slice(-100), // Only save last 100 entries
        savedAt: Date.now(),
      };
      localStorage.setItem('letterfall-debug-logs', JSON.stringify(data));
    } catch (error) {
      // Storage might be full or unavailable
      console.warn('Failed to save logs to storage:', error);
    }
  }

  private loadStoredEntries(): void {
    try {
      const stored = localStorage.getItem('letterfall-debug-logs');
      if (stored) {
        const data = JSON.parse(stored);
        if (data.entries && Array.isArray(data.entries)) {
          this.entries = data.entries;
        }
      }
    } catch (error) {
      console.warn('Failed to load stored logs:', error);
    }
  }
}

// Create category-specific loggers
export const createCategoryLogger = (category: string) => {
  const logger = Logger.getInstance();
  
  return {
    debug: (message: string, data?: any) => logger.debug(category, message, data),
    info: (message: string, data?: any) => logger.info(category, message, data),
    warn: (message: string, data?: any) => logger.warn(category, message, data),
    error: (message: string, data?: any) => logger.error(category, message, data),
  };
};

// Pre-configured loggers for common categories
export const gameLogger = createCategoryLogger('Game');
export const performanceLogger = createCategoryLogger('Performance');
export const accessibilityLogger = createCategoryLogger('Accessibility');
export const mobileLogger = createCategoryLogger('Mobile');
export const resourceLogger = createCategoryLogger('Resources');
export const errorLogger = createCategoryLogger('Error');