import { handleTabClosed, handleTabCreated, handleTabUpdated } from '../services/graphOrchestrator';
import { logger } from '../../lib/utils/logger';

export function registerTabTracker(): void {
  chrome.tabs.onCreated.addListener((tab) => {
    void handleTabCreated(tab).catch((error) => {
      logger.error('Failed to handle tab creation', error);
    });
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    void handleTabUpdated(tabId, changeInfo, tab).catch((error) => {
      logger.error('Failed to handle tab update', error);
    });
  });

  chrome.tabs.onRemoved.addListener((tabId) => {
    void handleTabClosed(tabId).catch((error) => {
      logger.error('Failed to handle tab close', error);
    });
  });
}