import type { EventRecord } from '../../shared/types';
import { putEvent } from '../../lib/db/repositories/eventRepository';
import { createId } from '../../lib/utils/id';
import { logger } from '../../lib/utils/logger';
import { writeQueue } from '../queues/writeQueue';
import { isCurrentSession } from './sessionState';

type LogEventInput = Omit<EventRecord, 'id'>;

export async function logEvent(input: LogEventInput): Promise<EventRecord> {
  const event: EventRecord = {
    id: createId('event'),
    ...input,
  };

  if (!isCurrentSession(event.sessionId)) {
    logger.debug('Dropped event for stale session', {
      type: event.type,
      sessionId: event.sessionId,
    });

    return event;
  }

  writeQueue.enqueue(async () => {
    await putEvent(event);
  });

  logger.debug('Event queued', {
    type: event.type,
    sessionId: event.sessionId,
    tabId: event.tabId,
    tabKey: event.tabKey,
  });

  return event;
}