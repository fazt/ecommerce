import { describe, expect, it } from 'vitest';
import { issueCsrf, verifyCsrfFromCookies, csrfCookie } from '@/lib/csrf';

describe('CSRF', () => {
  it('round-trips a token', async () => {
    const { token, cookieValue } = issueCsrf();
    await expect(verifyCsrfFromCookies(cookieValue, token)).resolves.toBeUndefined();
  });

  it('rejects mismatched header and cookie', async () => {
    const { cookieValue } = issueCsrf();
    await expect(verifyCsrfFromCookies(cookieValue, 'different')).rejects.toThrow(/mismatch/);
  });

  it('rejects missing cookie', async () => {
    const { token } = issueCsrf();
    await expect(verifyCsrfFromCookies(undefined, token)).rejects.toThrow(/Missing/);
  });

  it('rejects tampered signature', async () => {
    const { token } = issueCsrf();
    const tampered = `${token}.deadbeef`;
    await expect(verifyCsrfFromCookies(tampered, token)).rejects.toThrow(/signature/);
  });

  it('builds a valid Set-Cookie header', () => {
    const cookie = csrfCookie('abc.def');
    expect(cookie).toContain('csrf=abc.def');
    expect(cookie).toContain('Path=/');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('HttpOnly');
  });
});