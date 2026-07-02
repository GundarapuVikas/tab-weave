/// <reference types="chrome" />

import { bootstrapExtension, ensureActiveSession } from './bootstrap';
import { logger } from '../lib/utils/logger';
import { registerMessageRouter } from './services/messageRouter';
import { seedExistingTabs } from './services/graphOrchestrator';
import { registerActivationTracker } from './trackers/activationTracker';
import { registerNavigationTracker } from './trackers/navigationTracker';
import { registerSessionTracker } from './trackers/sessionTracker';
import { registerTabTracker } from './trackers/tabTracker';

let trackersRegistered = false;
let routerRegistered = false;

function registerTrackers(): void {
  if (trackersRegistered) {
    return;
  }

  registerSessionTracker();
  registerActivationTracker();
  registerTabTracker();
  registerNavigationTracker();

  trackersRegistered = true;
}

function registerRouter(): void {
  if (routerRegistered) {
    return;
  }

  registerMessageRouter();
  routerRegistered = true;
}

async function initializeBackground(): Promise<void> {
  await ensureActiveSession();
  registerRouter();
  registerTrackers();
  await seedExistingTabs();

  logger.info('Background initialized');
}

chrome.runtime.onInstalled.addListener(() => {
  void bootstrapExtension();
});

chrome.runtime.onStartup.addListener(() => {
  void bootstrapExtension();
});

void initializeBackground();