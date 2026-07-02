import { handleNavigationCommitted } from '../services/graphOrchestrator';
import { logger } from '../../lib/utils/logger';

export function registerNavigationTracker(): void {
  chrome.webNavigation.onCommitted.addListener((details) => {
    if (details.frameId !== 0) {
      return;
    }

    void handleNavigationCommitted({
      tabId: details.tabId,
      url: details.url,
      transitionType: details.transitionType,
      transitionQualifiers: details.transitionQualifiers,
    }).catch((error) => {
      logger.error('Failed to handle committed navigation', error);
    });
  });
}