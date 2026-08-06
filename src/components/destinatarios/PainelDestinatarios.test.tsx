import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PainelDestinatarios, type TextosDoPainel } from './PainelDestinatarios';

// O painel serve DUAS listas (aviso diário e relatório semanal) a partir dos
// mesmos hooks parametrizados. Estes testes existem porque essa unificação é
// exatamente onde um erro passaria despercebido: se o componente voltasse a
// importar hooks direto, ou se o texto de uma lista vazasse para a outra, nada
// no arquivo acusaria — as duas telas continuariam "funcionando".

const mutacaoVazia = { mutate: vi.fn(), isPending: false };

function hooksComLista(lista: Array<{ id: string; email: string; nome: string | null; ativo: boolean }>) {
  return {
    usarLista: (() => ({ data: lista, isLoading: false, isError: false, error: null })) as never,
    usarCriar: (() => mutacaoVazia) as never,
    usarAlternar: (() => mutacaoVazia) as never,
    usarExcluir: (() => mutacaoVazia) as never,
  };
}

const TEXTOS_RELATORIO: TextosDoPainel = {
  tituloCadastro: 'Novo destinatário do relatório',
  descricaoCadastro: 'Recebe o resumo toda segunda às 7h.',
  exemploEmail: 'diretoria@purepilates.com.br',
  nomeDoEnvio: 'o relatório semanal',
  idPrefixo: 'relatorio',
};

const TEXTOS_AVISO: TextosDoPainel = {
  tituloCadastro: 'Novo destinatário',
  descricaoCadastro: 'Recebe o aviso no dia da inauguração.',
  exemploEmail: 'marketing@purepilates.com.br',
  nomeDoEnvio: 'o aviso de inauguração',
  idPrefixo: 'destinatario',
};

beforeEach(() => vi.clearAllMocks());

describe('PainelDestinatarios', () => {
  it('lista vazia avisa que NADA será enviado, nomeando o envio certo', () => {
    render(<PainelDestinatarios hooks={hooksComLista([])} textos={TEXTOS_RELATORIO} />);

    // O aviso precisa citar o relatório, e não o aviso diário: é a troca mais
    // provável de acontecer ao reaproveitar o componente.
    expect(screen.getByText(/o relatório semanal não é enviado/i)).toBeInTheDocument();
    expect(screen.queryByText(/aviso de inauguração/i)).not.toBeInTheDocument();
  });

  it('avisa quando existe gente cadastrada mas ninguém ativo', () => {
    render(
      <PainelDestinatarios
        hooks={hooksComLista([{ id: '1', email: 'a@b.com', nome: null, ativo: false }])}
        textos={TEXTOS_RELATORIO}
      />,
    );

    expect(screen.getByText(/nenhum destinatário está ativo/i)).toBeInTheDocument();
    expect(screen.getByText(/o relatório semanal não será enviado/i)).toBeInTheDocument();
  });

  it('não avisa nada quando há alguém ativo', () => {
    render(
      <PainelDestinatarios
        hooks={hooksComLista([{ id: '1', email: 'a@b.com', nome: 'Ana', ativo: true }])}
        textos={TEXTOS_RELATORIO}
      />,
    );

    expect(screen.queryByText(/não será enviado/i)).not.toBeInTheDocument();
    expect(screen.getByText('a@b.com')).toBeInTheDocument();
    expect(screen.getByText('Ana')).toBeInTheDocument();
  });

  it('os ids dos campos levam o prefixo da lista', () => {
    // Sem prefixo, os dois painéis teriam id="email" e o <label> de um
    // apontaria para o campo do outro se algum dia aparecerem juntos.
    const { unmount } = render(
      <PainelDestinatarios hooks={hooksComLista([])} textos={TEXTOS_RELATORIO} />,
    );
    expect(document.querySelector('#relatorio-email')).not.toBeNull();
    expect(document.querySelector('#destinatario-email')).toBeNull();
    unmount();

    render(<PainelDestinatarios hooks={hooksComLista([])} textos={TEXTOS_AVISO} />);
    expect(document.querySelector('#destinatario-email')).not.toBeNull();
  });

  it('renderiza o aviso de topo quando a lista tem um', () => {
    render(
      <PainelDestinatarios
        hooks={hooksComLista([])}
        textos={{ ...TEXTOS_RELATORIO, avisoDeTopo: <p>O envio ainda não está ativo.</p> }}
      />,
    );
    expect(screen.getByText('O envio ainda não está ativo.')).toBeInTheDocument();
  });
});
