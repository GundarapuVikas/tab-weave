import { logger } from '../../lib/utils/logger';

export function registerSessionTracker(): void {
  chrome.runtime.onSuspend.addListener(() => {
    logger.info('Service worker suspending');
  });
}