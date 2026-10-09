import { describe, expect, it, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));

const { gruposDe } = await import('./produtosStore');
type Produto = Parameters<typeof gruposDe>[0][number];

const produto = (nome: string, grupo: string): Produto => ({
  id: nome,
  chave: nome,
  nome,
  preco: 10,
  grupo,
  ativo: true,
});

describe('gruposDe', () => {
  it('não repete grupo e põe Uniformes na frente', () => {
    expect(
      gruposDe([
        produto('Canga', 'Acessórios'),
        produto('Meia', 'Meias'),
        produto('Polo Adm', 'Uniformes'),
        produto('Nécessaire', 'Acessórios'),
      ]),
    ).toEqual(['Uniformes', 'Acessórios', 'Meias']);
  });

  it('ordena o resto em português, com acento no lugar certo', () => {
    expect(gruposDe([produto('a', 'Óculos'), produto('b', 'Acessórios'), produto('c', 'Meias')])).toEqual([
      'Acessórios',
      'Meias',
      'Óculos',
    ]);
  });

  it('devolve lista vazia sem produto nenhum', () => {
    expect(gruposDe([])).toEqual([]);
  });
});
