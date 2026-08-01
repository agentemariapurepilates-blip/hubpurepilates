import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { format, addDays, subDays } from 'date-fns';
import { ListaInauguracoes } from './ListaInauguracoes';
import { useAuth } from '@/contexts/AuthContext';
import { useEditarInauguracao, useExcluirInauguracao, useInauguracoes } from '../hooks/useInauguracoes';
import type { InauguracaoRequest } from '../types';

// Esta é a linha de negócio mais importante da feature (ver
// ListaInauguracoes.tsx): `isAdmin || podeAlterar(...)`. Trocar o `||` por
// `&&`, ou remover o `isAdmin`, faz o admin perder Editar/Excluir em toda
// solicitação dentro da janela de 48h — e nada mais no arquivo acusaria isso.
// Os três casos abaixo cobrem exatamente a tabela-verdade que a regra promete.

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../hooks/useInauguracoes', () => ({
  useInauguracoes: vi.fn(),
  useEditarInauguracao: vi.fn(),
  useExcluirInauguracao: vi.fn(),
}));

const CONTATO_MARKETING = 'Para alterar, entre em contato com o marketing.';

// Margem folgada de propósito: bem além dos 60 dias, o resultado de
// podeAlterar() não depende de que horas são agora nem de em que dia o teste
// roda.
const DATA_DENTRO_DO_PRAZO = format(addDays(new Date(), 60), 'yyyy-MM-dd');
// Uma data no passado já reprova até a checagem mais frouxa possível (a
// própria data da inauguração já passou, então o corte de 48h antes também).
const DATA_FORA_DO_PRAZO = format(subDays(new Date(), 10), 'yyyy-MM-dd');

function item(data_inauguracao: string): InauguracaoRequest {
  return {
    id: 'inaug-1',
    user_id: 'user-1',
    nome_unidade: 'Unidade Teste',
    unidade_id: 'UT-01',
    endereco: 'Rua Teste, 123',
    solicitante_nome: 'Fulana',
    solicitante_email: 'fulana@purepilates.com.br',
    data_inauguracao,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
}

function mutacaoStub() {
  return { mutate: vi.fn(), isPending: false } as unknown as ReturnType<typeof useEditarInauguracao>;
}

function preparar(options: { isAdmin: boolean; lista: InauguracaoRequest[] }) {
  vi.mocked(useAuth).mockReturnValue({ isAdmin: options.isAdmin } as ReturnType<typeof useAuth>);
  vi.mocked(useInauguracoes).mockReturnValue({
    data: options.lista,
    isLoading: false,
    isError: false,
    error: null,
  } as unknown as ReturnType<typeof useInauguracoes>);
  vi.mocked(useEditarInauguracao).mockReturnValue(mutacaoStub());
  vi.mocked(useExcluirInauguracao).mockReturnValue(mutacaoStub());
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ListaInauguracoes — regra das 48h', () => {
  it('colaborador dentro do prazo vê Editar e Excluir', () => {
    preparar({ isAdmin: false, lista: [item(DATA_DENTRO_DO_PRAZO)] });
    render(<ListaInauguracoes />);

    expect(screen.getByRole('button', { name: /Editar/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Excluir/ })).toBeInTheDocument();
    expect(screen.queryByText(CONTATO_MARKETING)).not.toBeInTheDocument();
  });

  it('colaborador fora do prazo não vê botão nenhum, só o aviso do marketing', () => {
    preparar({ isAdmin: false, lista: [item(DATA_FORA_DO_PRAZO)] });
    render(<ListaInauguracoes />);

    expect(screen.queryByRole('button', { name: /Editar/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Excluir/ })).not.toBeInTheDocument();
    expect(screen.getByText(CONTATO_MARKETING)).toBeInTheDocument();
  });

  it('admin fora do prazo vê Editar e Excluir assim mesmo', () => {
    // Este é o caso que o mutante `isAdmin && podeAlterar(...)` (ou a remoção
    // do `isAdmin`) quebraria: sem o `||`, o admin ficaria preso à mesma
    // janela de 48h do colaborador.
    preparar({ isAdmin: true, lista: [item(DATA_FORA_DO_PRAZO)] });
    render(<ListaInauguracoes />);

    expect(screen.getByRole('button', { name: /Editar/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Excluir/ })).toBeInTheDocument();
    expect(screen.queryByText(CONTATO_MARKETING)).not.toBeInTheDocument();
  });
});
