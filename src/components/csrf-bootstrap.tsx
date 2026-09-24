'use client';

import { useEffect, useState } from 'react';
import { CSRF_HEADER } from '@/lib/csrf-header';

/**
 * Mounts once per session, fetches a CSRF token + cookie from the server,
 * and exposes both for client components to attach to mutating fetches.
 */
export function CsrfBootstrap() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/csrf')
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setToken(data.token);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!token) return;
    // Monkey-patch window.fetch to attach the CSRF header automatically.
    const original = window.fetch.bind(window);
    (window as unknown as { __csrfPatched?: boolean }).__csrfPatched = true;
    window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
      const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
      if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
        const headers = new Headers(init?.headers);
        if (!headers.has(CSRF_HEADER)) headers.set(CSRF_HEADER, token);
        return original(input, { ...init, headers });
      }
      return original(input, init);
    }) as typeof fetch;
  }, [token]);

  return null;
}