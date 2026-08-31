import { describe, expect, it } from 'vitest';

import {
  MESES_COM_PDM,
  PLATAFORMAS,
  avaliarMes,
  avaliarMesTotal,
  avaliarSemanas,
  cargasDesalinhadas,
  detalheDoMeta,
  horizonteComum,
  planoDoMes,
  realizadoEntre,
  situacao,
  ultimoDiaDe,
} from './avaliacao';
import { PDM } from '../dados/pdm';

describe('horizontes', () => {
  it('cada plataforma tem o seu último dia', () => {
    for (const p of PLATAFORMAS) {
      expect(ultimoDiaDe(p)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  // Em 24/08/2026 o Google estava parado em 11/08 e o Meta em 23/08. Somar as
  // duas sem cortar no menor compararia 11 dias com 23 e chamaria de agosto.
  it('o horizonte comum é o MENOR último dia entre as plataformas', () => {
    const menor = PLATAFORMAS.map(ultimoDiaDe).sort()[0];

    expect(horizonteComum()).toBe(menor);
  });

  it('acusa quando uma carga ficou para trás da outra', () => {
    const todosIguais = new Set(PLATAFORMAS.map(ultimoDiaDe)).size === 1;

    expect(cargasDesalinhadas()).toBe(!todosIguais);
  });
});

describe('planoDoMes', () => {
  it('as duas plataformas somam o total declarado do mês', () => {
    const mes = PDM.find((m) => m.mes === '2026-08')!;
    const meta = planoDoMes('2026-08', 'meta')!;
    const google = planoDoMes('2026-08', 'google')!;

    expect(meta.verba + google.verba).toBe(mes.declarados.liquido);
  });

  // O Google devolve conversão como um número só. Para as duas plataformas se
  // compararem, o plano soma agendamento e lead no mesmo grão.
  it('conversões planejadas somam agendamento e lead', () => {
    const google = planoDoMes('2026-08', 'google')!;
    const linhas = PDM.find((m) => m.mes === '2026-08')!.campanhas.filter(
      (c) => c.plataforma === 'google',
    );
    const esperado = linhas.reduce((a, c) => a + (c.agendamentos ?? 0) + (c.leads ?? 0), 0);

    expect(google.conversoes).toBe(esperado);
  });

  it('devolve null para mês sem PDM', () => {
    expect(planoDoMes('2025-01', 'meta')).toBeNull();
  });
});

describe('realizadoEntre', () => {
  it('separa as plataformas', () => {
    const meta = realizadoEntre('2026-07-01', '2026-07-31', 'meta');
    const google = realizadoEntre('2026-07-01', '2026-07-31', 'google');

    expect(meta.verba).toBeGreaterThan(0);
    expect(google.verba).toBeGreaterThan(0);
    expect(meta.verba).not.toBe(google.verba);
  });

  // Conferido contra a Graph API antes de o SmartAds virar fonte: julho/26
  // devolve 1.190 agendamentos e 426 leads nos dois lugares.
  it('reproduz os números que a API do Meta dá para julho', () => {
    const detalhe = detalheDoMeta('2026-07-01', '2026-07-31');

    expect(detalhe.agendamentos).toBe(1190);
    expect(detalhe.leads).toBe(426);
  });

  it('no Meta, conversões é a soma de agendamentos e leads', () => {
    const total = realizadoEntre('2026-07-01', '2026-07-31', 'meta');
    const detalhe = detalheDoMeta('2026-07-01', '2026-07-31');

    expect(total.conversoes).toBe(detalhe.agendamentos + detalhe.leads);
  });

  it('devolve zero para intervalo sem dado', () => {
    expect(realizadoEntre('2020-01-01', '2020-01-31', 'meta').verba).toBe(0);
  });
});

describe('avaliarMes', () => {
  it('num mês fechado, a meta é o mês inteiro', () => {
    const julho = avaliarMes('2026-07', 'meta')!;

    expect(julho.emCurso).toBe(false);
    expect(julho.diasCorridos).toBe(31);
    expect(julho.planoAteAqui.verba).toBe(julho.planoCheio.verba);
    expect(julho.projecao).toBeNull();
  });

  // Sem isso, todo dia 5 de qualquer mês pareceria uma catástrofe.
  it('num mês em curso, a meta é só a fatia dos dias corridos', () => {
    const agosto = avaliarMes('2026-08', 'meta')!;

    expect(agosto.emCurso).toBe(true);
    expect(agosto.planoAteAqui.verba).toBeCloseTo(
      (agosto.planoCheio.verba * agosto.diasCorridos) / agosto.diasNoMes,
      4,
    );
  });

  // A carga do Google parou antes da do Meta: cada uma é avaliada até onde o
  // dado dela vai, senão o Google apareceria como queda de veiculação.
  it('cada plataforma para no seu próprio último dia', () => {
    const meta = avaliarMes('2026-08', 'meta')!;
    const google = avaliarMes('2026-08', 'google')!;

    expect(meta.ate).toBe(ultimoDiaDe('meta'));
    expect(google.ate).toBe(ultimoDiaDe('google'));
  });

  it('aceita um limite forçado, para o total poder alinhar as duas', () => {
    const meta = avaliarMes('2026-08', 'meta', '2026-08-11')!;

    expect(meta.ate).toBe('2026-08-11');
    expect(meta.diasCorridos).toBe(11);
    expect(meta.realizado.verba).toBeCloseTo(
      realizadoEntre('2026-08-01', '2026-08-11', 'meta').verba,
      4,
    );
  });

  it('projeta o fechamento pelo ritmo dos dias corridos', () => {
    const agosto = avaliarMes('2026-08', 'meta')!;

    expect(agosto.projecao!.verba).toBeCloseTo(
      (agosto.realizado.verba * agosto.diasNoMes) / agosto.diasCorridos,
      4,
    );
  });
});

describe('avaliarMesTotal', () => {
  it('soma as duas plataformas no horizonte comum', () => {
    const total = avaliarMesTotal('2026-08')!;
    const comum = horizonteComum();

    expect(total.plataforma).toBeNull();
    expect(total.ate).toBe(comum);

    const meta = avaliarMes('2026-08', 'meta', comum)!;
    const google = avaliarMes('2026-08', 'google', comum)!;
    expect(total.realizado.verba).toBeCloseTo(meta.realizado.verba + google.realizado.verba, 4);
    expect(total.planoCheio.verba).toBe(meta.planoCheio.verba + google.planoCheio.verba);
  });

  // O total de um mês fechado tem que bater com a verba que a planilha declara.
  it('num mês fechado, o plano cheio é o total declarado da planilha', () => {
    const julho = avaliarMesTotal('2026-07')!;
    const declarado = PDM.find((m) => m.mes === '2026-07')!.declarados.liquido;

    expect(julho.planoCheio.verba).toBe(declarado);
    expect(julho.emCurso).toBe(false);
  });

  // O achado que motivou trazer o Google: sozinho o Meta parecia muito abaixo
  // do plano; com as duas plataformas o mês roda perto do planejado.
  it('o total fica mais perto do plano do que o Meta sozinho', () => {
    const total = avaliarMesTotal('2026-07')!;
    const meta = avaliarMes('2026-07', 'meta')!;

    const pct = (a: typeof total) => a.comparacoes.find((c) => c.chave === 'verba')!.atingimento!;
    expect(pct(total)).toBeGreaterThan(pct(meta));
    expect(pct(total)).toBeGreaterThan(85);
  });
});

describe('avaliarSemanas', () => {
  const semanas = avaliarSemanas('2026-08', 'meta');

  it('a soma das semanas bate com o mês da mesma plataforma', () => {
    const mes = avaliarMes('2026-08', 'meta')!;

    expect(semanas.reduce((a, s) => a + s.diasNoMes, 0)).toBe(mes.diasCorridos);
    expect(semanas.reduce((a, s) => a + s.realizado.verba, 0)).toBeCloseTo(mes.realizado.verba, 4);
    expect(semanas.reduce((a, s) => a + s.realizado.conversoes, 0)).toBe(mes.realizado.conversoes);
  });

  it('toda semana começa numa segunda-feira', () => {
    for (const s of semanas) {
      const [ano, mes, dia] = s.de.split('-').map(Number);
      expect(new Date(ano, mes - 1, dia).getDay()).toBe(1);
    }
  });

  // A primeira semana de agosto/26 começa na segunda 27/07. Contar os sete
  // dias somaria a agosto um gasto que foi de julho.
  it('conta só os dias que caem dentro do mês avaliado', () => {
    const primeira = semanas[0];

    expect(primeira.de < '2026-08-01').toBe(true);
    expect(primeira.diasNoMes).toBeLessThan(7);
    expect(primeira.realizado.verba).toBeCloseTo(
      realizadoEntre('2026-08-01', primeira.ate, 'meta').verba,
      4,
    );
  });

  it('dá à semana cheia uma meta de sete trinta-e-um-avos do mês', () => {
    const plano = planoDoMes('2026-08', 'meta')!;
    const cheia = semanas.find((s) => s.diasNoMes === 7)!;

    expect(cheia.planejado.verba).toBeCloseTo((plano.verba * 7) / 31, 4);
  });

  it('respeita o horizonte da plataforma pedida', () => {
    for (const s of avaliarSemanas('2026-08', 'google')) {
      expect(s.de <= ultimoDiaDe('google')).toBe(true);
    }
  });

  it('devolve lista vazia para mês sem PDM', () => {
    expect(avaliarSemanas('2025-01', 'meta')).toEqual([]);
  });
});

describe('MESES_COM_PDM', () => {
  it('lista os meses do mais recente para o mais antigo', () => {
    expect(MESES_COM_PDM).toHaveLength(PDM.length);
    expect(MESES_COM_PDM[0]).toBe('2026-08');
    expect(MESES_COM_PDM[MESES_COM_PDM.length - 1]).toBe('2026-04');
  });
});

describe('situacao', () => {
  it('classifica pelas faixas', () => {
    expect(situacao(120)).toBe('acima');
    expect(situacao(100)).toBe('no-alvo');
    expect(situacao(80)).toBe('abaixo');
    expect(situacao(40)).toBe('muito-abaixo');
    expect(situacao(null)).toBeNull();
  });

  // 10% de diferença é ruído de veiculação. Pintar isso de vermelho ensina a
  // ignorar a cor, e aí o vermelho de verdade também passa batido.
  it('não trata 10% de diferença como problema', () => {
    expect(situacao(91)).toBe('no-alvo');
    expect(situacao(109)).toBe('no-alvo');
  });

  // Gastar 130% do planejado é tão fora do plano quanto gastar 70%.
  it('trata gasto acima do plano como desvio, não como acerto', () => {
    expect(situacao(130)).toBe('acima');
    expect(situacao(130)).not.toBe('no-alvo');
  });
});
