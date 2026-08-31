import { describe, expect, it } from 'vitest';

import { gerarRelatorioDaAvaliacao, nomeDoArquivo } from './avaliacaoPdf';
import { MESES_COM_PDM } from './avaliacao';

/**
 * Estes testes geram o PDF de verdade.
 *
 * No jsdom o logo nunca carrega (não há rede nem decodificador de imagem), e é
 * exatamente por isso que o teste vale: ele percorre o caminho em que
 * `carregarLogo` devolve null. Se alguém trocar aquele `resolve(null)` por um
 * throw, o botão passa a quebrar para todo mundo e é aqui que isso aparece.
 */
describe('gerarRelatorioDaAvaliacao', () => {
  const mesEmCurso = MESES_COM_PDM[0];
  const mesFechado = MESES_COM_PDM[1];

  it('gera um PDF do mês em curso', async () => {
    const blob = await gerarRelatorioDaAvaliacao({ mes: mesEmCurso, meses: MESES_COM_PDM });

    expect(blob.type).toBe('application/pdf');
    // Um PDF com cinco meses de tabela não cabe em poucos bytes; o piso pega o
    // caso em que tudo falhou e sobrou só o cabeçalho.
    expect(blob.size).toBeGreaterThan(5000);
  });

  it('gera um PDF de um mês já fechado', async () => {
    const blob = await gerarRelatorioDaAvaliacao({ mes: mesFechado, meses: MESES_COM_PDM });

    expect(blob.size).toBeGreaterThan(5000);
  });

  it('começa com a assinatura de um PDF', async () => {
    const blob = await gerarRelatorioDaAvaliacao({ mes: mesEmCurso, meses: MESES_COM_PDM });
    const inicio = new Uint8Array(await blob.arrayBuffer()).slice(0, 5);

    expect(String.fromCharCode(...inicio)).toBe('%PDF-');
  });

  // Um mês sem PDM não deve derrubar o botão: o relatório sai dizendo que não
  // há plano, em vez de estourar na cara de quem clicou.
  it('não quebra num mês sem PDM', async () => {
    const blob = await gerarRelatorioDaAvaliacao({ mes: '2025-01', meses: MESES_COM_PDM });

    expect(blob.type).toBe('application/pdf');
  });
});

describe('nomeDoArquivo', () => {
  it('não usa caractere que o Windows recuse', () => {
    const nome = nomeDoArquivo('2026-08');

    expect(nome).toBe('avaliacao-de-midia-2026-08-pure-pilates.pdf');
    expect(nome).not.toMatch(/[\\/:*?"<>|]/);
  });
});
