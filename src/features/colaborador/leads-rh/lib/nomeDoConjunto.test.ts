import { describe, expect, it } from 'vitest';

import { interpretarConjunto, normalizar } from './nomeDoConjunto';

// Os nomes abaixo são reais, lidos da conta de anúncios. Trocar por exemplos
// inventados tiraria o valor do teste: o que precisa ser garantido é que o
// parser aguenta a bagunça que existe, não a que seria fácil.
//
// Vieram de `midia-paga/lib/nomenclatura.test.ts`, que saiu do Hub junto com o
// resto da mídia paga. Só os casos de CONJUNTO foram trazidos — é o único
// pedaço que o Leads RH usa.

describe('interpretarConjunto', () => {
  it('lê o formato de DCO com unidade no fim', () => {
    expect(interpretarConjunto('dco | interesses | leads | sacoma')).toMatchObject({
      formato: 'conjunto-dco',
      unidade: 'sacoma',
      segmento: 'leads',
    });
  });

  // Tratar estado como unidade faria o painel inventar 15 unidades chamadas
  // "bahia", cada uma com a verba de um estado inteiro.
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

  it('lê a região no lugar da unidade', () => {
    expect(interpretarConjunto('sao-paulo | advantage | aberto-21-a-40-anos')).toMatchObject({
      formato: 'conjunto-unidade',
      unidade: null,
      regiao: 'sao-paulo',
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

  // A conta tem "são-bernardo-do-campo" e "sao-bernardo-do-campo" convivendo.
  // Sem normalizar, a mesma unidade viraria duas no agrupamento.
  it('tira o acento antes de comparar', () => {
    expect(interpretarConjunto('dco | interesses | leads | são-bernardo-do-campo').unidade).toBe(
      'sao-bernardo-do-campo',
    );
  });

  it('devolve formato nulo para o que não casa com nada', () => {
    expect(interpretarConjunto('teste rapido sem barra').formato).toBeNull();
  });

  it('não quebra com nome vazio', () => {
    expect(interpretarConjunto('').formato).toBeNull();
  });
});

describe('normalizar', () => {
  // O intervalo de diacríticos é escrito como escape no código-fonte, e não
  // como caractere: um combining mark literal é invisível no editor e some em
  // qualquer reformatação, levando a normalização junto sem ninguém ver.
  it('tira acento, caixa e espaço sobrando', () => {
    expect(normalizar('  São Paulo  ')).toBe('sao paulo');
    expect(normalizar('JACAREÍ')).toBe('jacarei');
    expect(normalizar('Sacomã')).toBe('sacoma');
  });
});
