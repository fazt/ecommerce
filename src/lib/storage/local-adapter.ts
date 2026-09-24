/**
 * Local disk adapter. Writes under public/uploads/<key>. Files are served by
 * Next.js as static assets under /uploads/<key>.
 *
 * NOT suitable for serverless deployments where the filesystem is ephemeral;
 * swap to a VercelBlobAdapter / S3Adapter in production.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { StorageAdapter, type StoragePutOptions, type StoragePutResult } from './adapter';

const ROOT = path.join(process.cwd(), 'public', 'uploads');

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export const localStorageAdapter: StorageAdapter = {
  async put(key: string, data: Buffer | Uint8Array, _opts?: StoragePutOptions): Promise<StoragePutResult> {
    if (key.includes('..')) throw new Error('Invalid storage key');
    const fullPath = path.join(ROOT, key);
    await ensureDir(path.dirname(fullPath));
    await fs.writeFile(fullPath, data);
    return { url: `/uploads/${key}`, key, bytes: data.byteLength };
  },
  async delete(key: string): Promise<void> {
    if (key.includes('..')) return;
    const fullPath = path.join(ROOT, key);
    await fs.unlink(fullPath).catch(() => undefined);
  },
  url(key: string): string {
    return `/uploads/${key}`;
  },
};

export type { StorageAdapter, StoragePutOptions, StoragePutResult };