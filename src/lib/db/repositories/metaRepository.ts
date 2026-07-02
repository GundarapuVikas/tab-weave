import { STORE_NAMES } from '../../../shared/constants';
import type { MetaRecord } from '../../../shared/types';
import { getDb } from '../indexedDb';

export async function putMeta<T>(id: string, value: T): Promise<void> {
  const db = await getDb();

  const record: MetaRecord = {
    id,
    value,
  };

  await db.put(STORE_NAMES.meta, record);
}

export async function getMeta<T>(id: string): Promise<T | undefined> {
  const db = await getDb();
  const record = await db.get(STORE_NAMES.meta, id);

  return record?.value as T | undefined;
}

export async function deleteMeta(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_NAMES.meta, id);
}

export async function clearMeta(): Promise<void> {
  const db = await getDb();
  await db.clear(STORE_NAMES.meta);
}