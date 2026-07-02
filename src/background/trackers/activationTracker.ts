import { handleTabActivated } from '../services/graphOrchestrator';
import { logger } from '../../lib/utils/logger';

export function registerActivationTracker(): void {
  chrome.tabs.onActivated.addListener((activeInfo) => {
    void handleTabActivated({
      tabId: activeInfo.tabId,
      windowId: activeInfo.windowId,
    }).catch((error) => {
      logger.error('Failed to handle tab activation', error);
    });
  });
}