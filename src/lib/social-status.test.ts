import { describe, it, expect } from 'vitest';
import { getStatusLabel, getStatusBadgeColor } from './social-status';

describe('getStatusLabel', () => {
  it('retorna "Conectado" para status active', () => {
    expect(getStatusLabel('active')).toBe('Conectado');
  });

  it('retorna "Token expirado" para status expired', () => {
    expect(getStatusLabel('expired')).toBe('Token expirado');
  });

  it('retorna "Acesso revogado" para status revoked', () => {
    expect(getStatusLabel('revoked')).toBe('Acesso revogado');
  });

  it('retorna "Não conectado" para null/undefined', () => {
    expect(getStatusLabel(null)).toBe('Não conectado');
    expect(getStatusLabel(undefined)).toBe('Não conectado');
  });
});

describe('getStatusBadgeColor', () => {
  it('retorna verde para active', () => {
    expect(getStatusBadgeColor('active')).toBe('bg-emerald-500 text-white');
  });

  it('retorna amarelo para expired', () => {
    expect(getStatusBadgeColor('expired')).toBe('bg-amber-400 text-slate-900');
  });

  it('retorna vermelho para revoked', () => {
    expect(getStatusBadgeColor('revoked')).toBe('bg-red-500 text-white');
  });

  it('retorna cinza para null/undefined', () => {
    expect(getStatusBadgeColor(null)).toBe('bg-slate-200 text-slate-700');
  });
});
