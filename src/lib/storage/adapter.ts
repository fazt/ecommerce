/**
 * StorageAdapter interface. The local adapter writes under
 * public/uploads/. Swap to a VercelBlobAdapter / S3Adapter without touching
 * the route handler.
 */

export interface StoragePutOptions {
  contentType?: string;
  cacheControl?: string;
}

export interface StoragePutResult {
  url: string;
  key: string;
  bytes: number;
}

export interface StorageAdapter {
  /** Upload a buffer or stream and return its public URL. */
  put(key: string, data: Buffer | Uint8Array, opts?: StoragePutOptions): Promise<StoragePutResult>;
  /** Delete by key. No-op if missing. */
  delete(key: string): Promise<void>;
  /** Resolve a key to its public URL. */
  url(key: string): string;
}