import { describe, expect, it } from 'vitest';
import { interpretarConjunto } from './nomeDoConjunto';

describe('interpretarConjunto', () => {
  it('lê o formato de DCO com unidade no fim', () => {
    expect(interpretarConjunto('dco | interesses | leads | sacoma')).toMatchObject({
      formato: 'conjunto-dco',
      unidade: 'sacoma',
      segmento: 'leads',
    });
  });

  it('não trata estado como unidade no DCO de venda', () => {
    const lido = interpretarConjunto('dco | interesses | venda | bahia');
    expect(lido.unidade).toBeNull();
    expect(lido.regiao).toBe('bahia');
  });

  it('lê o formato por unidade e separa RH de aula experimental', () => {
    expect(interpretarConjunto('penha | sao-paulo | cargos | instrutor-pilates')).toMatchObject({
      formato: 'conjunto-unidade',
      unidade: 'penha',
      regiao: 'sao-paulo',
      segmento: 'cargos',
    });
    expect(
      interpretarConjunto('faria-lima | sao-paulo | advantage | aberto-21-a-40-anos').segmento,
    ).toBe('advantage');
  });

  it('lê o formato de produto, que não tem unidade', () => {
    expect(interpretarConjunto('always-on | pilates play | interesses')).toMatchObject({
      formato: 'conjunto-produto',
      unidade: null,
      segmento: 'pilates play',
    });
  });

  it('reconhece a duplicata feita no braço', () => {
    const lido = interpretarConjunto(
      'vila-bandeirantes-via-anchieta | sao-paulo | cargos | instrutor-pilates — Cópia',
    );
    expect(lido.copia).toBe(true);
    // O sufixo não pode atrapalhar a leitura do resto.
    expect(lido.unidade).toBe('vila-bandeirantes-via-anchieta');
  });

  it('tira o acento antes de comparar', () => {
    expect(interpretarConjunto('dco | interesses | leads | são-bernardo-do-campo').unidade).toBe(
      'sao-bernardo-do-campo',
    );
  });

  it('devolve formato nulo para o que não casa com nada', () => {
    expect(interpretarConjunto('teste rapido sem barra').formato).toBeNull();
  });
});
