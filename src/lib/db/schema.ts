import type { DBSchema } from 'idb';
import { STORE_NAMES } from '../../shared/constants';
import type {
  EdgeRecord,
  EventRecord,
  MetaRecord,
  NodeRecord,
  SessionRecord,
} from '../../shared/types';

export interface TabWeaveDB extends DBSchema {
  [STORE_NAMES.sessions]: {
    key: string;
    value: SessionRecord;
    indexes: {
      'by-startedAt': number;
      'by-endedAt': number;
    };
  };
  [STORE_NAMES.events]: {
    key: string;
    value: EventRecord;
    indexes: {
      'by-sessionId': string;
      'by-timestamp': number;
      'by-tabKey': string;
      'by-type': string;
      'by-session-timestamp': [string, number];
    };
  };
  [STORE_NAMES.nodes]: {
    key: string;
    value: NodeRecord;
    indexes: {
      'by-sessionId': string;
      'by-rootId': string;
      'by-updatedAt': number;
      'by-url': string;
      'by-tabId': number;
      'by-status': string;
    };
  };
  [STORE_NAMES.edges]: {
    key: string;
    value: EdgeRecord;
    indexes: {
      'by-sessionId': string;
      'by-from': string;
      'by-to': string;
      'by-createdAt': number;
    };
  };
  [STORE_NAMES.meta]: {
    key: string;
    value: MetaRecord;
    indexes: {};
  };
}