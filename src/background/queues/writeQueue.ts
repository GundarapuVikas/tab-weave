import { TIMING } from '../../shared/constants';
import { logger } from '../../lib/utils/logger';

type WriteJob = () => Promise<void>;

export class WriteQueue {
  private jobs: WriteJob[] = [];
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private flushPromise: Promise<void> | null = null;

  enqueue(job: WriteJob): void {
    this.jobs.push(job);
    this.scheduleFlush();
  }

  /** Drops not-yet-started jobs and cancels the timer. Does not cancel an in-flight batch. */
  clear(): void {
    this.jobs.length = 0;
    this.cancelTimer();
  }

  /**
   * Joins an in-flight flush and resolves once all jobs queued before or during
   * the call have settled. Failed jobs are logged, never rethrown.
   */
  flush(): Promise<void> {
    if (this.flushPromise) {
      return this.flushPromise;
    }

    if (this.jobs.length === 0) {
      return Promise.resolve();
    }

    this.flushPromise = this.runFlush().finally(() => {
      this.flushPromise = null;

      // Handle jobs enqueued after the loop's last check.
      if (this.jobs.length > 0) {
        this.scheduleFlush();
      }
    });

    return this.flushPromise;
  }

  private async runFlush(): Promise<void> {
    this.cancelTimer();

    while (this.jobs.length > 0) {
      const batch = this.jobs.splice(0, this.jobs.length);
      // The async wrapper turns synchronous job throws into rejections.
      const results = await Promise.allSettled(batch.map(async (job) => job()));

      for (const result of results) {
        if (result.status === 'rejected') {
          logger.error('WriteQueue job failed', result.reason);
        }
      }
    }
  }

  private scheduleFlush(): void {
    if (this.timerId !== null || this.flushPromise !== null) {
      return;
    }

    this.timerId = setTimeout(() => {
      this.timerId = null;
      void this.flush().catch((error) => {
        logger.error('WriteQueue flush failed', error);
      });
    }, TIMING.writeQueueFlushMs);
  }

  private cancelTimer(): void {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }
}

export const writeQueue = new WriteQueue();
