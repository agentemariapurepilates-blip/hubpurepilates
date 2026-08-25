import { describe, expect, it } from 'vitest';
import {
  classificarFrente,
  interpretarCampanha,
  interpretarCampanhaDoGoogle,
  interpretarConjunto,
  plataformaDoNome,
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
      } else if (formato.onde === 'campanha-google') {
        expect(interpretarCampanhaDoGoogle(formato.exemplo).noPadrao, formato.id).toBe(true);
        // O detector tem que concordar com o manual, senão o exemplo cairia no
        // parser errado em produção mesmo passando aqui.
        expect(plataformaDoNome(formato.exemplo), formato.id).toBe('google');
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

// Os nomes desta seção foram lidos da conta em 24/08/2026 e cobrem os dois
// jeitos de a verba sumir do manual sem nada ter mudado na operação.
describe('a campanha renomeada de três partes para duas', () => {
  // Em agosto/26 a agência trocou "[Rise] dco | always-on | apartadas" por
  // "[Rise] always-on | apartadas". Lendo o público por posição fixa, ele
  // virava null e as apartadas inteiras caíam como "fora do manual".
  it('ainda acha o público na última parte', () => {
    expect(interpretarCampanha('[Rise] always-on | apartadas').publico).toBe('apartadas');
  });

  it('classifica as apartadas mesmo sem o tipo no nome', () => {
    const { frenteId, origem } = classificarFrente(
      '[Rise] always-on | apartadas',
      'interesses | leads | recife/casa-forte-estrada-do-encanamento',
    );

    expect(frenteId).toBe('apartadas');
    expect(origem).toBe('publico-da-campanha');
  });

  // O nome de duas partes ESTÁ fora da convenção, e a regra que avisa isso tem
  // que seguir disparando — o que não pode é a verba sumir do eixo por causa
  // disso.
  it('continua marcando o nome como fora do padrão', () => {
    expect(interpretarCampanha('[Rise] always-on | apartadas').noPadrao).toBe(false);
    expect(interpretarCampanha('[Rise] dco | always-on | apartadas').noPadrao).toBe(true);
  });
});

describe('as campanhas do Google Ads', () => {
  it('reconhece a plataforma pelo formato do nome', () => {
    expect(plataformaDoNome('rise_ao_search_cpa_institucional')).toBe('google');
    expect(plataformaDoNome('[Rise] dco | always-on | todas')).toBe('meta');
    expect(plataformaDoNome('[Rise] always-on | apartadas')).toBe('meta');
  });

  it('lê o público na última parte, como no Meta', () => {
    expect(interpretarCampanhaDoGoogle('rise_ao_search_cpa_institucional').publico).toBe(
      'institucional',
    );
    expect(interpretarCampanhaDoGoogle('rise_ao_search_cpa_pilates').publico).toBe('pilates');
  });

  // Sem este leitor, R$ 42.665 de agosto/26 — 39% do investimento do mês —
  // caíam como "fora do manual" só porque o nome não usa barra vertical.
  it('leva a busca por marca e a genérica para agendamento de aula', () => {
    for (const nome of ['rise_ao_search_cpa_institucional', 'rise_ao_search_cpa_pilates']) {
      const { frenteId, origem } = classificarFrente(nome, nome);
      expect(frenteId, nome).toBe('agendamento-de-aula');
      expect(origem, nome).toBe('publico-da-campanha');
    }
  });

  // O vídeo de consideração é awareness de marca, que não é nenhuma das sete
  // frentes do manual. Ficar "fora do manual" aqui é a resposta certa: é assim
  // que a tela avisa que existe verba rodando sem frente declarada.
  it('deixa o vídeo de consideração fora do manual, de propósito', () => {
    const nome = 'rise_flight_video_cpm_consideração';

    expect(classificarFrente(nome, nome).frenteId).toBeNull();
  });

  it('não confunde nome do Google com nome do Meta', () => {
    expect(interpretarCampanhaDoGoogle('rise_ao_search_cpa_institucional').noPadrao).toBe(true);
    expect(interpretarCampanhaDoGoogle('rise_flight_video_cpm_consideração').noPadrao).toBe(true);
  });
});
