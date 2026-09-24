/**
 * Storage adapter registry. Import from here; switch implementations in one
 * place when swapping providers.
 */

import { localStorageAdapter } from './local-adapter';
import type { StorageAdapter } from './adapter';

export const storageAdapter: StorageAdapter = localStorageAdapter;

export type { StorageAdapter, StoragePutOptions, StoragePutResult } from './adapter';