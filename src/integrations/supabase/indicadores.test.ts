import { describe, it, expect } from 'vitest';
import { INDICADORES_AUTH_OPTIONS } from './indicadores';

describe('cliente Supabase de indicadores', () => {
  it('não persiste sessão — senão sobrescreve o login do Hub no localStorage', () => {
    expect(INDICADORES_AUTH_OPTIONS.persistSession).toBe(false);
    expect(INDICADORES_AUTH_OPTIONS.autoRefreshToken).toBe(false);
  });

  it('usa uma storageKey própria, diferente da do cliente do Hub', () => {
    expect(INDICADORES_AUTH_OPTIONS.storageKey).toBe('sb-indicadores-noauth');
  });
});
