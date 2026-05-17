/**
 * Telemetry Service
 * Structured observability for app lifecycle, performance, and errors.
 */

import { db, type TelemetryLog } from './localDB';

type Stage = 'init' | 'auth' | 'db' | 'hydration' | 'sync' | 'security' | 'error';
type Status = 'start' | 'success' | 'error';

export interface TelemetryEvent {
  event: string;
  stage: Stage;
  status: Status;
  duration?: number;
  metadata?: Record<string, unknown>;
}

class TelemetryService {
  private activeTimers: Map<string, number> = new Map();

  /**
   * Start a timer for a specific event
   */
  startTimer(key: string) {
    this.activeTimers.set(key, performance.now());
  }

  /**
   * End a timer and return duration
   */
  endTimer(key: string): number | undefined {
    const start = this.activeTimers.get(key);
    if (start === undefined) return undefined;
    this.activeTimers.delete(key);
    return performance.now() - start;
  }

  /**
   * Log a structured event to IndexedDB and console
   */
  async log(data: TelemetryEvent) {
    const timestamp = Date.now();
    const logEntry: TelemetryLog = {
      ...data,
      timestamp,
    };

    // Console output for development
    const statusColor =
      data.status === 'success' ? '\x1b[32m' : data.status === 'error' ? '\x1b[31m' : '\x1b[34m';
    const resetColor = '\x1b[0m';

    console.info(
      `[${data.stage.toUpperCase()}] ${data.event} - ${statusColor}${data.status.toUpperCase()}${resetColor} ${
        data.duration ? `(${data.duration.toFixed(2)}ms)` : ''
      }`,
      data.metadata || ''
    );

    try {
      if (db.isOpen()) {
        await db.telemetry.add(logEntry);

        // Retention: Keep only last 1000 logs
        const count = await db.telemetry.count();
        if (count > 1100) {
          const oldest = await db.telemetry.orderBy('id').limit(100).keys();
          await db.telemetry.bulkDelete(oldest as number[]);
        }
      }
    } catch (err) {
      // Fail silently for telemetry persistence errors to avoid blocking app
      console.warn('Failed to persist telemetry log:', err);
    }
  }

  /**
   * Helper to wrap an async operation with telemetry
   */
  async trace<T>(
    key: string,
    stage: Stage,
    operation: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    this.startTimer(key);
    await this.log({ event: key, stage, status: 'start', metadata });

    try {
      const result = await operation();
      const duration = this.endTimer(key);
      await this.log({ event: key, stage, status: 'success', duration, metadata });
      return result;
    } catch (error: unknown) {
      const duration = this.endTimer(key);
      await this.log({
        event: key,
        stage,
        status: 'error',
        duration,
        metadata: { ...metadata, error: error instanceof Error ? error.message : String(error) },
      });
      throw error;
    }
  }

  /**
   * Export logs for debugging
   */
  async getLogs(limit = 100): Promise<TelemetryLog[]> {
    return await db.telemetry.orderBy('timestamp').reverse().limit(limit).toArray();
  }
}

export const telemetry = new TelemetryService();
