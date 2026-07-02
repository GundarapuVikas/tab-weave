import { TIMING } from '../../shared/constants';

export class WriteQueue {
  private jobs: Array<() => Promise<void>> = [];
  private timerId: number | null = null;
  private flushing = false;

  enqueue(job: () => Promise<void>): void {
    this.jobs.push(job);
    this.scheduleFlush();
  }

  async flush(): Promise<void> {
    if (this.flushing || this.jobs.length === 0) {
      return;
    }

    this.flushing = true;

    try {
      while (this.jobs.length > 0) {
        const batch = this.jobs.splice(0, this.jobs.length);
        await Promise.all(batch.map((job) => job()));
      }
    } finally {
      this.flushing = false;

      if (this.timerId !== null) {
        clearTimeout(this.timerId);
        this.timerId = null;
      }
    }
  }

  private scheduleFlush(): void {
    if (this.timerId !== null) {
      return;
    }

    this.timerId = setTimeout(() => {
      void this.flush();
    }, TIMING.writeQueueFlushMs) as unknown as number;
  }
}

export const writeQueue = new WriteQueue();