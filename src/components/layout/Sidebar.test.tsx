import { describe, it, expect } from 'vitest';
import { sectionFromPath } from './Sidebar';

describe('sectionFromPath', () => {
  it('abre a seção Dashboard nas rotas do Painel de Indicadores', () => {
    expect(sectionFromPath('/dashboard/visao-geral')).toBe('dashboard');
    expect(sectionFromPath('/dashboard/top-10-unidades')).toBe('dashboard');
    expect(sectionFromPath('/dashboard/visao-diaria')).toBe('dashboard');
    expect(sectionFromPath('/dashboard/cronologia')).toBe('dashboard');
    expect(sectionFromPath('/dashboard/administracao')).toBe('dashboard');
  });

  it('mantém /minha-area/dashboard em Minha Área — não confunde com a seção nova', () => {
    expect(sectionFromPath('/minha-area/dashboard')).toBe('minha-area');
  });

  it('não mexe nas seções que já existiam', () => {
    expect(sectionFromPath('/feed')).toBe('colaboradores');
    expect(sectionFromPath('/agente-design/gerar-foto')).toBe('agentes');
    expect(sectionFromPath('/admin/usuarios')).toBe('admin');
    expect(sectionFromPath('/avisos')).toBe(null);
  });
});
