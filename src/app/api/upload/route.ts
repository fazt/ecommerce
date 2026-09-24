/**
 * POST /api/upload — admin-only image upload. Stores via the StorageAdapter.
 */

import { withRole } from '@/lib/http/with-auth';
import { withCsrf } from '@/lib/http/with-csrf';
import { jsonOk } from '@/lib/http/with-errors';
import { storageAdapter } from '@/lib/storage';
import { writeAudit } from '@/lib/audit';
import { ValidationError } from '@/lib/errors';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

export const POST = withCsrf(withRole(['ADMIN', 'SUPER_ADMIN'], async ({ req }, _params) => {
  const formData = await req.formData();
  const file = formData.get('file');
  const folder = (formData.get('folder') as string) ?? 'misc';
  if (!(file instanceof File)) throw new ValidationError('Missing file');
  if (file.size > MAX_BYTES) throw new ValidationError('File too large (max 5MB)');
  if (!ALLOWED.has(file.type)) throw new ValidationError('Unsupported MIME type');
  if (folder.includes('..') || folder.includes('/')) throw new ValidationError('Invalid folder');

  const ext = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1] ?? 'bin';
  const key = `${folder}/${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await storageAdapter.put(key, buffer, { contentType: file.type });

  await writeAudit({
    userId: undefined,
    action: 'upload.image',
    entity: 'StorageObject',
    entityId: key,
    changes: { url: result.url, bytes: result.bytes },
  });

  return jsonOk(result);
}));

export const runtime = 'nodejs';