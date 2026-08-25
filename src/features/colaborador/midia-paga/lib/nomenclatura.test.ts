import { describe, expect, it } from 'vitest';
import {
  classificarFrente,
  interpretarCampanha,
  interpretarConjunto,
} from './nomenclatura';
import { FORMATOS, FRENTES } from '../dados/cerebro';

// Os nomes abaixo são reais, lidos da conta em 17/08/2026. Trocar por exemplos
// inventados tiraria o valor do teste: o que precisa ser garantido é que o
// parser aguenta a bagunça que existe, não a que seria fácil.

describe('interpretarCampanha', () => {
  it('separa marca, tipo, contexto e público', () => {
    expect(interpretarCampanha('[Rise] dco | always-on | apartadas')).toMatchObject({
      marca: 'Rise',
      tipo: 'dco',
      contexto: 'always-on',
      publico: 'apartadas',
      noPadrao: true,
    });
  });

  it('acusa o espaçamento torto sem perder o conteúdo', () => {
    // Esta campanha existe assim na conta: "venda|" colado.
    const lido = interpretarCampanha('[Rise] venda| always-on | academy');
    expect(lido.tipo).toBe('venda');
    expect(lido.publico).toBe('academy');
    expect(lido.espacamentoTorto).toBe(true);
    expect(lido.noPadrao).toBe(false);
  });

  it('marca como fora do padrão o nome que não tem as três partes', () => {
    expect(interpretarCampanha('campanha nova').noPadrao).toBe(false);
  });
});

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

describe('classificarFrente', () => {
  it('usa o público da campanha, e não o formato de compra do conjunto', () => {
    // A armadilha: o conjunto começa com "dco", mas a verba é apartada.
    // Classificar pelo conjunto jogaria toda a verba das unidades em DCO.
    expect(
      classificarFrente('[Rise] dco | always-on | apartadas', 'dco | interesses | leads | sacoma'),
    ).toEqual({ frenteId: 'apartadas', origem: 'publico-da-campanha' });
  });

  it('cai no tipo da campanha quando o público é genérico', () => {
    expect(
      classificarFrente('[Rise] dco | always-on | todas', 'dco | interesses | venda | bahia'),
    ).toEqual({ frenteId: 'dco', origem: 'tipo-da-campanha' });
  });

  it('reconhece RH, Academy e Pilates Play pelo público', () => {
    expect(
      classificarFrente('[Rise] lead-ad | always-on | rh-instrutor', 'penha | sao-paulo | cargos | instrutor-pilates')
        .frenteId,
    ).toBe('rh');
    expect(
      classificarFrente('[Rise] lead-site | always-on | academy', 'always-on | store | interesses')
        .frenteId,
    ).toBe('academy');
    expect(
      classificarFrente('[Rise] venda | always-on | pilates play', 'always-on | pilates play | interesses')
        .frenteId,
    ).toBe('pilates-play');
  });

  it('não usa "advantage" para reconhecer aula experimental', () => {
    // Esta é a armadilha real da conta: os conjuntos da Academy se chamam
    // "belenzinho | sao-paulo | advantage | aberto-21-a-40-anos". "advantage" é
    // a segmentação automática do Meta, usada em qualquer frente. Se ela fosse
    // marcador de agendamento de aula, a verba da Academy migraria de eixo.
    expect(
      classificarFrente(
        '[Rise] lead-ad | always-on | academy',
        'belenzinho | sao-paulo | advantage | aberto-21-a-40-anos',
      ).frenteId,
    ).toBe('academy');
  });

  it('devolve nulo para campanha que o manual não cobre', () => {
    // "store" e "franquias" existem na conta e não estão em nenhum eixo do
    // manual. Inventar uma frente para elas esconderia a decisão de incluí-las.
    expect(classificarFrente('[Rise] venda | always-on | store', 'always-on | store | rmkt').frenteId)
      .toBeNull();
    expect(
      classificarFrente('[Rise] lead-site | always-on | franquias', 'nome qualquer').frenteId,
    ).toBeNull();
  });
});

describe('coerência do manual', () => {
  it('todo formato declarado tem exemplo que o parser entende', () => {
    for (const formato of FORMATOS) {
      if (formato.onde === 'campanha') {
        expect(interpretarCampanha(formato.exemplo).noPadrao, formato.id).toBe(true);
      } else {
        expect(interpretarConjunto(formato.exemplo).formato, formato.id).toBe(formato.id);
      }
    }
  });

  it('nenhuma frente fica sem marcador', () => {
    for (const frente of FRENTES) {
      expect(frente.marcadores.length, frente.id).toBeGreaterThan(0);
    }
  });
});
