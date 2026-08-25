import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';

import { AnunciosNoAr } from './AnunciosNoAr';
import arquivo from '../dados/criativos.json';

/**
 * Estes testes rodam contra o ARQUIVO DE VERDADE, e não contra um exemplo.
 *
 * É de propósito. A aba tem um jeito específico de falhar em silêncio: se a
 * leitura do criativo deixar de achar o texto — porque o Meta mudou o formato,
 * ou porque a captura pediu os campos errados —, ela não quebra. Ela renderiza
 * uma lista de campanhas bonita e vazia, com todos os textos sumidos, e nada na
 * tela acusa. Só um teste que exige texto de verdade na tela pega isso.
 */
describe('AnunciosNoAr', () => {
  it('mostra quantos anúncios estão no ar', () => {
    render(<AnunciosNoAr />);

    const noAr = arquivo.anuncios.filter((a) => a.effective_status === 'ACTIVE').length;
    expect(screen.getByText(String(noAr))).toBeInTheDocument();
  });

  // O texto que mais roda na conta: 26 anúncios de aula experimental.
  it('mostra o texto que os anúncios de aula experimental estão dizendo', () => {
    render(<AnunciosNoAr />);

    expect(
      screen.getAllByText(/A maior rede de pilates da América Latina sempre tem uma unidade perto/i)
        .length,
    ).toBeGreaterThan(0);
  });

  it('mostra o defeito de tabulação escondida, com o nome do anúncio', () => {
    render(<AnunciosNoAr />);

    const alerta = screen.getByRole('alert');
    expect(within(alerta).getByText(/instrutor-pilates \| jardim-paulistano/)).toBeInTheDocument();
    expect(within(alerta).getAllByText(/tabulação ou espaço rígido/i).length).toBeGreaterThan(0);
  });

  // `BOOK_TRAVEL` é o código do Meta para o botão "Reservar". Mostrar o código
  // cru faria a tela de aula experimental parecer anúncio de viagem.
  it('traduz o botão do Meta para o que o público lê', () => {
    render(<AnunciosNoAr />);

    expect(screen.getAllByText('Reservar').length).toBeGreaterThan(0);
    expect(screen.queryByText('BOOK_TRAVEL')).not.toBeInTheDocument();
  });

  it('não mostra campanha sem nenhum anúncio no ar', () => {
    render(<AnunciosNoAr />);

    expect(screen.queryByText('[Rise] venda | always-on | pilates play')).not.toBeInTheDocument();
  });
});
