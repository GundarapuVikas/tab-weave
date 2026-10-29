/// <reference types="chrome" />

import { bootstrapExtension, ensureActiveSession } from './bootstrap';
import { logger } from '../lib/utils/logger';
import { registerMessageRouter } from './services/messageRouter';
import { seedExistingTabs } from './services/graphOrchestrator';
import { registerActivationTracker } from './trackers/activationTracker';
import { registerNavigationTracker } from './trackers/navigationTracker';
import { registerSessionTracker } from './trackers/sessionTracker';
import { registerTabTracker } from './trackers/tabTracker';

let initializationPromise: Promise<void> | null = null;

function initializeBackground(): Promise<void> {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      await ensureActiveSession();
      await seedExistingTabs();
      logger.info('Background initialized');
    })().catch((error) => {
      // Allow a later event to retry after a transient IndexedDB failure.
      initializationPromise = null;
      throw error;
    });
  }

  return initializationPromise;
}

async function startNewSession(): Promise<void> {
  try {
    await initializeBackground();
  } catch (error) {
    logger.error('Initialization failed before session bootstrap', error);
  }

  await bootstrapExtension();
  await seedExistingTabs();

  logger.info('Session bootstrapped');
}

// Chrome requires listeners to be registered synchronously during module
// evaluation so events that wake the service worker are not dropped.
registerMessageRouter();
registerActivationTracker();
registerTabTracker();
registerNavigationTracker();
registerSessionTracker();

chrome.runtime.onInstalled.addListener(() => {
  void startNewSession().catch((error) => {
    logger.error('onInstalled bootstrap failed', error);
  });
});

chrome.runtime.onStartup.addListener(() => {
  void startNewSession().catch((error) => {
    logger.error('onStartup bootstrap failed', error);
  });
});

void initializeBackground().catch((error) => {
  logger.error('Background initialization failed', error);
});
