/**
 * A avaliação do PDM: o que foi planejado contra o que aconteceu, mês a mês e
 * semana a semana, nas duas plataformas.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * POR QUE AS DUAS PLATAFORMAS, E NÃO SÓ O META
 * ────────────────────────────────────────────────────────────────────────────
 * A primeira versão avaliava só o Meta, porque era só o que o Hub media. O
 * resultado era enviesado de um jeito que não dava para consertar na tela: o
 * Meta gasta ABAIXO do planejado e o Google ACIMA, e os dois se compensam.
 * Olhando só o Meta, abril a julho apareciam a 54–85% do plano; com o Google
 * no cálculo, o plano roda a 90–94%. A conclusão inverte.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * CADA PLATAFORMA TEM O SEU PRÓPRIO ATÉ-QUANDO
 * ────────────────────────────────────────────────────────────────────────────
 * As cargas do SmartAds são independentes e uma pode parar sem a outra parar.
 * Em 24/08/2026 o Google estava parado em 11/08 e o Meta em 23/08.
 *
 * Somar as duas num total do mês compararia 11 dias de Google com 23 de Meta e
 * chamaria isso de agosto. Por isso o TOTAL usa o horizonte comum — o menor
 * último-dia entre as plataformas — enquanto cada plataforma, sozinha, é
 * avaliada até onde o dado dela vai. `horizonteComum()` existe para que a tela
 * possa dizer isso em voz alta.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * A SEMANA É DERIVADA, O MÊS É PLANEJADO
 * ────────────────────────────────────────────────────────────────────────────
 * O PDM planeja o MÊS. Não existe meta semanal na planilha: a de cada semana
 * aqui é a fatia proporcional aos dias dela que caem dentro do mês.
 *
 * A divisão é por dia corrido, sem curva de dia da semana. As campanhas são
 * always-on com orçamento diário, então o gasto já sai praticamente plano; uma
 * curva aqui brigaria com a que o Ritmo do Mês usa, e duas curvas discordando
 * é pior do que nenhuma.
 */

import { PDM } from '../dados/pdm';
import realizadoBruto from '../dados/realizado.json';
import { diasDoMes, segundaDaSemana } from './ritmo';

export type Plataforma = 'meta' | 'google';

export const PLATAFORMAS: Plataforma[] = ['meta', 'google'];

export const NOME_DA_PLATAFORMA: Record<Plataforma, string> = {
  meta: 'Meta Ads',
  google: 'Google Ads',
};

interface DiaBruto {
  data: string;
  plataforma: string;
  verba: number;
  impressoes: number;
  cliques: number;
  conversoes: number;
  /** Só o Meta separa evento por tipo; no Google vem null. */
  agendamentos: number | null;
  leads: number | null;
}

const DIAS = realizadoBruto.dias as DiaBruto[];

export const LIDO_EM = realizadoBruto.lido_em as string;
export const FONTE = realizadoBruto.fonte as string;

/** Até quando o dado de cada plataforma vai. */
export const HORIZONTES = realizadoBruto.plataformas as Record<
  string,
  { ultimo_dia: string; dias: number }
>;

export const ultimoDiaDe = (plataforma: Plataforma): string =>
  HORIZONTES[plataforma]?.ultimo_dia ?? '';

/**
 * O menor último-dia entre as plataformas.
 *
 * É até aqui que faz sentido somar as duas: além disso, o total seria a soma
 * de períodos diferentes.
 */
export const horizonteComum = (): string =>
  PLATAFORMAS.map(ultimoDiaDe)
    .filter(Boolean)
    .reduce((menor, d) => (d < menor ? d : menor), '9999-12-31');

/** Verdadeiro quando uma carga ficou para trás da outra. */
export const cargasDesalinhadas = (): boolean =>
  new Set(PLATAFORMAS.map(ultimoDiaDe)).size > 1;

/**
 * Os quatro números que plano e realizado têm em comum nas DUAS plataformas.
 *
 * `conversoes` é o denominador comum possível: o Meta entrega a quebra por
 * tipo de evento, o Google entrega só um total. Forçar uma quebra no Google
 * seria inventar dado que a plataforma não deu.
 */
export interface Indicadores {
  verba: number;
  impressoes: number;
  cliques: number;
  conversoes: number;
}

const ZERO: Indicadores = { verba: 0, impressoes: 0, cliques: 0, conversoes: 0 };

export const INDICADORES: Array<{ chave: keyof Indicadores; nome: string; dinheiro?: boolean }> = [
  { chave: 'verba', nome: 'Verba', dinheiro: true },
  { chave: 'conversoes', nome: 'Conversões' },
  { chave: 'impressoes', nome: 'Impressões' },
  { chave: 'cliques', nome: 'Cliques' },
];

const somar = (a: Indicadores, b: Indicadores): Indicadores => ({
  verba: a.verba + b.verba,
  impressoes: a.impressoes + b.impressoes,
  cliques: a.cliques + b.cliques,
  conversoes: a.conversoes + b.conversoes,
});

const proporcional = (i: Indicadores, fator: number): Indicadores => ({
  verba: i.verba * fator,
  impressoes: i.impressoes * fator,
  cliques: i.cliques * fator,
  conversoes: i.conversoes * fator,
});

/**
 * O que o PDM planeja para uma plataforma num mês.
 *
 * `conversoes` planejadas somam agendamento e lead: é o que o Google devolve
 * como um número só, então é nesse grão que as duas plataformas se comparam.
 */
export function planoDoMes(mes: string, plataforma: Plataforma): Indicadores | null {
  const planejado = PDM.find((m) => m.mes === mes);
  if (!planejado) return null;

  return planejado.campanhas
    .filter((c) => c.plataforma === plataforma)
    .reduce<Indicadores>(
      (acc, c) => ({
        verba: acc.verba + c.liquido,
        impressoes: acc.impressoes + (c.impressoes ?? 0),
        cliques: acc.cliques + (c.cliques ?? 0),
        conversoes: acc.conversoes + (c.agendamentos ?? 0) + (c.leads ?? 0),
      }),
      { ...ZERO },
    );
}

/** Soma os dias de uma plataforma num intervalo, com as duas pontas incluídas. */
export function realizadoEntre(de: string, ate: string, plataforma: Plataforma): Indicadores {
  return DIAS.filter((d) => d.plataforma === plataforma && d.data >= de && d.data <= ate).reduce<
    Indicadores
  >(
    (acc, d) => ({
      verba: acc.verba + d.verba,
      impressoes: acc.impressoes + d.impressoes,
      cliques: acc.cliques + d.cliques,
      // No Meta a soma dos dois eventos é a conversão que o PDM planeja; no
      // Google o total já vem pronto, sem quebra possível.
      conversoes:
        acc.conversoes +
        (plataforma === 'meta' ? (d.agendamentos ?? 0) + (d.leads ?? 0) : d.conversoes),
    }),
    { ...ZERO },
  );
}

/** A quebra que só o Meta tem: agendamento de aula e lead de formulário. */
export function detalheDoMeta(de: string, ate: string): { agendamentos: number; leads: number } {
  return DIAS.filter((d) => d.plataforma === 'meta' && d.data >= de && d.data <= ate).reduce(
    (acc, d) => ({
      agendamentos: acc.agendamentos + (d.agendamentos ?? 0),
      leads: acc.leads + (d.leads ?? 0),
    }),
    { agendamentos: 0, leads: 0 },
  );
}

export interface Comparacao {
  chave: keyof Indicadores;
  nome: string;
  dinheiro: boolean;
  planejado: number;
  realizado: number;
  /** Realizado sobre a meta do período, em %. Null quando não há meta. */
  atingimento: number | null;
}

function comparar(planejado: Indicadores, realizado: Indicadores): Comparacao[] {
  return INDICADORES.map(({ chave, nome, dinheiro }) => {
    const meta = planejado[chave];
    return {
      chave,
      nome,
      dinheiro: Boolean(dinheiro),
      planejado: meta,
      realizado: realizado[chave],
      atingimento: meta > 0 ? (realizado[chave] / meta) * 100 : null,
    };
  });
}

export interface Avaliacao {
  mes: string;
  /** Null quando é o total das duas plataformas. */
  plataforma: Plataforma | null;
  diasNoMes: number;
  /** Dias do mês que já têm número para esta plataforma. */
  diasCorridos: number;
  /** O último dia contado. */
  ate: string;
  emCurso: boolean;
  planoCheio: Indicadores;
  /** A fatia do plano correspondente aos dias já corridos. */
  planoAteAqui: Indicadores;
  realizado: Indicadores;
  comparacoes: Comparacao[];
  /** Onde o mês fecha se o ritmo continuar. Null se o mês já fechou. */
  projecao: Indicadores | null;
}

/**
 * Avalia um mês numa plataforma, até onde o dado dela vai.
 *
 * `ateForcado` serve ao total: ali as duas plataformas precisam parar no mesmo
 * dia, mesmo que uma tenha dado além dele.
 */
export function avaliarMes(
  mes: string,
  plataforma: Plataforma,
  ateForcado?: string,
): Avaliacao | null {
  const planoCheio = planoDoMes(mes, plataforma);
  if (!planoCheio) return null;

  const dias = diasDoMes(mes);
  const primeiro = dias[0];
  const ultimoDoMes = dias[dias.length - 1];

  const limite = ateForcado ?? ultimoDiaDe(plataforma);
  const ate = limite < ultimoDoMes ? limite : ultimoDoMes;
  const emCurso = limite < ultimoDoMes;

  const diasCorridos = dias.filter((d) => d <= ate).length;
  const fatia = dias.length > 0 ? diasCorridos / dias.length : 0;

  const planoAteAqui = emCurso ? proporcional(planoCheio, fatia) : planoCheio;
  const realizado = realizadoEntre(primeiro, ate, plataforma);

  return {
    mes,
    plataforma,
    diasNoMes: dias.length,
    diasCorridos,
    ate,
    emCurso,
    planoCheio,
    planoAteAqui,
    realizado,
    comparacoes: comparar(planoAteAqui, realizado),
    projecao:
      emCurso && diasCorridos > 0 ? proporcional(realizado, dias.length / diasCorridos) : null,
  };
}

/**
 * O mês somando as duas plataformas, no horizonte comum.
 *
 * Sem o horizonte comum, agosto somaria 11 dias de Google com 23 de Meta e
 * chamaria o resultado de "agosto".
 */
export function avaliarMesTotal(mes: string): Avaliacao | null {
  const comum = horizonteComum();
  const porPlataforma = PLATAFORMAS.map((p) => avaliarMes(mes, p, comum)).filter(
    (a): a is Avaliacao => a !== null,
  );
  if (porPlataforma.length === 0) return null;

  const base = porPlataforma[0];
  const planoCheio = porPlataforma.map((a) => a.planoCheio).reduce(somar);
  const planoAteAqui = porPlataforma.map((a) => a.planoAteAqui).reduce(somar);
  const realizado = porPlataforma.map((a) => a.realizado).reduce(somar);

  return {
    mes,
    plataforma: null,
    diasNoMes: base.diasNoMes,
    diasCorridos: base.diasCorridos,
    ate: base.ate,
    emCurso: base.emCurso,
    planoCheio,
    planoAteAqui,
    realizado,
    comparacoes: comparar(planoAteAqui, realizado),
    projecao:
      base.emCurso && base.diasCorridos > 0
        ? proporcional(realizado, base.diasNoMes / base.diasCorridos)
        : null,
  };
}

/** Os meses com PDM, do mais recente para o mais antigo. */
export const MESES_COM_PDM = PDM.map((m) => m.mes).sort((a, b) => b.localeCompare(a));

export interface AvaliacaoSemanal {
  /** Segunda-feira da semana. Pode cair no mês anterior. */
  de: string;
  /** Domingo, ou o último dia com dado. */
  ate: string;
  /** Quantos dias desta semana caem no mês E têm dado. */
  diasNoMes: number;
  completa: boolean;
  planejado: Indicadores;
  realizado: Indicadores;
  comparacoes: Comparacao[];
}

/**
 * As semanas de um mês, de segunda a domingo.
 *
 * A semana que atravessa a virada entra só pelos dias que caem DENTRO do mês
 * avaliado: contar a semana inteira somaria a agosto um gasto que foi de
 * julho.
 */
export function avaliarSemanas(mes: string, plataforma: Plataforma): AvaliacaoSemanal[] {
  const planoCheio = planoDoMes(mes, plataforma);
  if (!planoCheio) return [];

  const dias = diasDoMes(mes);
  if (dias.length === 0) return [];

  const limite = ultimoDiaDe(plataforma);

  const porSemana = new Map<string, string[]>();
  for (const dia of dias) {
    const segunda = segundaDaSemana(dia);
    porSemana.set(segunda, [...(porSemana.get(segunda) ?? []), dia]);
  }

  return [...porSemana.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([segunda, diasDaSemana]) => {
      const primeiro = diasDaSemana[0];
      const ultimo = diasDaSemana[diasDaSemana.length - 1];
      const ate = ultimo <= limite ? ultimo : limite;
      const temDado = primeiro <= limite;
      const diasContados = temDado ? diasDaSemana.filter((d) => d <= ate).length : 0;

      return {
        de: segunda,
        ate,
        diasNoMes: diasContados,
        completa: ultimo <= limite,
        planejado: proporcional(planoCheio, diasContados / dias.length),
        realizado: temDado ? realizadoEntre(primeiro, ate, plataforma) : { ...ZERO },
        comparacoes: comparar(
          proporcional(planoCheio, diasContados / dias.length),
          temDado ? realizadoEntre(primeiro, ate, plataforma) : { ...ZERO },
        ),
      };
    })
    .filter((s) => s.diasNoMes > 0);
}

/**
 * Como ler um atingimento.
 *
 * A faixa é larga de propósito: 10% de diferença entre plano e realizado é
 * ruído de veiculação, não decisão de ninguém. Pintar isso de vermelho ensina
 * a ignorar a cor — e aí o vermelho de verdade também passa batido.
 *
 * `acima` não é elogio: gastar 130% do planejado é tão fora do plano quanto
 * gastar 70%, e a tela trata os dois como desvio.
 */
export type Situacao = 'acima' | 'no-alvo' | 'abaixo' | 'muito-abaixo';

export function situacao(atingimento: number | null): Situacao | null {
  if (atingimento === null) return null;
  if (atingimento >= 110) return 'acima';
  if (atingimento >= 90) return 'no-alvo';
  if (atingimento >= 70) return 'abaixo';
  return 'muito-abaixo';
}
