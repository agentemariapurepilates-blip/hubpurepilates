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

  it('abre a seção Inaugurações em todas as rotas dela', () => {
    // Inaugurações saiu de dentro de Colaboradores e virou seção própria.
    expect(sectionFromPath('/inauguracoes')).toBe('inauguracoes');
    expect(sectionFromPath('/inauguracoes/nova')).toBe('inauguracoes');
    expect(sectionFromPath('/inauguracoes/solicitacoes')).toBe('inauguracoes');
    expect(sectionFromPath('/inauguracoes/destinatarios')).toBe('inauguracoes');
  });

  it('a ordem dos testes importa: Inaugurações vem antes de Colaboradores', () => {
    // Se o teste de '/inauguracoes' ficasse depois da lista de Colaboradores,
    // esta rota casaria com aquela lista e a seção errada abriria. Este caso
    // falha se alguém reordenar as verificações em sectionFromPath.
    expect(sectionFromPath('/inauguracoes/nova')).not.toBe('colaboradores');
    // E as rotas de Colaboradores continuam intactas.
    expect(sectionFromPath('/pedidos-demanda')).toBe('colaboradores');
    expect(sectionFromPath('/colaborador/midias-sociais/pure')).toBe('colaboradores');
  });
});
