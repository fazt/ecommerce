/**
 * URL-driven sorting and filtering for server-rendered tables.
 * State lives in `?sort=<key>&dir=<asc|desc>` so it is shareable, survives
 * `router.refresh()` and works without client JavaScript.
 */

export type SortDir = 'asc' | 'desc';
export type SearchParams = Record<string, string | string[] | undefined>;

export interface SortState<K extends string = string> {
  key: K;
  dir: SortDir;
}

export function param(sp: SearchParams, name: string): string | undefined {
  const v = sp[name];
  const s = Array.isArray(v) ? v[0] : v;
  return s && s.trim() ? s.trim() : undefined;
}

export function parseSort<K extends string>(
  sp: SearchParams,
  keys: readonly K[],
  fallback: SortState<K>,
): SortState<K> {
  const key = param(sp, 'sort');
  const dir = param(sp, 'dir');
  if (!key || !(keys as readonly string[]).includes(key)) return fallback;
  return { key: key as K, dir: dir === 'asc' || dir === 'desc' ? dir : fallback.dir };
}

/** Flattens search params into plain strings, applying `patch` (undefined removes a key). */
export function withParams(sp: SearchParams, patch: Record<string, string | undefined> = {}): string {
  const out = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    const s = Array.isArray(v) ? v[0] : v;
    if (s !== undefined && s !== '' && !(k in patch)) out.set(k, s);
  }
  for (const [k, v] of Object.entries(patch)) if (v !== undefined && v !== '') out.set(k, v);
  return out.toString();
}

/** Plain-string copy of search params, safe to pass to client components. */
export function plainParams(sp: SearchParams): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) {
    const s = Array.isArray(v) ? v[0] : v;
    if (s) out[k] = s;
  }
  return out;
}

/** In-memory comparator for lists that are sorted after fetching. */
export function compareBy<T>(get: (row: T) => string | number | boolean | Date | null | undefined, dir: SortDir) {
  const m = dir === 'asc' ? 1 : -1;
  return (a: T, b: T) => {
    const x = get(a);
    const y = get(b);
    if (x == null && y == null) return 0;
    if (x == null) return 1;
    if (y == null) return -1;
    if (typeof x === 'string' && typeof y === 'string') return x.localeCompare(y, undefined, { sensitivity: 'base' }) * m;
    return (Number(x) - Number(y)) * m;
  };
}
