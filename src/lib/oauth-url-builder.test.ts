import { describe, it, expect } from 'vitest';
import { buildOAuthUrl, generateState } from './oauth-url-builder';

describe('buildOAuthUrl', () => {
  it('monta URL Meta com parâmetros corretos', () => {
    const url = buildOAuthUrl({
      authorizeUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
      clientId: 'test_app_id',
      redirectUri: 'https://example.com/auth/callback/meta',
      scopes: ['instagram_basic', 'pages_show_list'],
      state: 'abc-123',
    });

    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe('https://www.facebook.com/v19.0/dialog/oauth');
    expect(parsed.searchParams.get('client_id')).toBe('test_app_id');
    expect(parsed.searchParams.get('redirect_uri')).toBe('https://example.com/auth/callback/meta');
    expect(parsed.searchParams.get('scope')).toBe('instagram_basic,pages_show_list');
    expect(parsed.searchParams.get('state')).toBe('abc-123');
    expect(parsed.searchParams.get('response_type')).toBe('code');
  });

  it('codifica caracteres especiais corretamente', () => {
    const url = buildOAuthUrl({
      authorizeUrl: 'https://www.tiktok.com/v2/auth/authorize/',
      clientId: 'aw_abc',
      redirectUri: 'https://example.com/auth/callback/tiktok',
      scopes: ['user.info.basic'],
      state: 'with spaces',
    });

    expect(url).toContain('state=with+spaces');
  });
});

describe('generateState', () => {
  it('gera string única e suficientemente longa', () => {
    const a = generateState();
    const b = generateState();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(32);
  });
});
