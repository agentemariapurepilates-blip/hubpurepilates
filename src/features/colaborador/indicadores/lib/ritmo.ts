/**
 * MTD, semana e previsão de fechamento — a leitura de ritmo do mês.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * O QUE O ESTUDO DOS MESES MOSTROU (jan a jul/2026, rede inteira)
 * ────────────────────────────────────────────────────────────────────────────
 *
 * 1. `cli_experimentais` e `cli_matriculas_total` NÃO são fluxo diário: são
 *    ACUMULADO NO MÊS, e zeram todo dia 1. Somar as colunas dia a dia infla o
 *    total em mais de dez vezes. O fluxo do dia é a diferença para o dia
 *    anterior — é o que `fluxoDiario` faz, e é a base de tudo aqui.
 *
 * 2. O mês NÃO é plano. Índice do dia da semana (1,00 = dia médio), medido do
 *    dia 2 em diante para não contaminar com o dia 1:
 *      seg 1,58 · ter 1,39 · qua 1,30 · qui 1,08 · sex 0,80 · sáb 0,43 · dom 0,44
 *    O perfil se repete: o desvio entre os sete meses fica em 5% a 18%.
 *
 * 3. O dia 1 não é um dia. Ele carrega de 9% a 26% do mês (média 19%) e vale de
 *    3 a 10 dias normais. Na outra ponta, o último dia do mês tem índice ~0,00 e
 *    o penúltimo 0,21. É movimento do fim do mês que só aparece na consolidação
 *    seguinte. Vale confirmar a causa com quem mantém a integração — mas para a
 *    leitura de ritmo o que importa é que o padrão é estável e previsível.
 *
 * 4. A METAS JÁ VÊM DIARIZADAS. `daily_goals` traz um alvo por dia, e a curva
 *    dele acompanha o comportamento real: a divergência entre a curva da meta e
 *    a curva realizada ficou em 10,3% (maio), 10,9% (junho) e 12,2% (julho) do
 *    mês. A meta de agosto reproduz o dia 1 grande (1.494 contra 182 no dia 2) e
 *    o domingo baixo.
 *
 * Por isso este módulo NÃO inventa uma diarização própria: usa a que existe e
 * mede a aderência dela. Uma segunda curva, calculada aqui, brigaria com a
 * oficial e ninguém saberia qual seguir.
 */

/** Uma leitura diária vinda do banco, com o acumulado do mês naquele dia. */
export interface LeituraDiaria {
  /** yyyy-MM-dd */
  data: string;
  /** O acumulado do mês até aquele dia, como está na coluna. */
  acumulado: number;
}

/**
 * Converte o acumulado do mês em fluxo diário.
 *
 * O dia 1 fica com o próprio valor (não há dia anterior dentro do mês). Os
 * demais recebem a diferença para o dia anterior, e a diferença PODE SER
 * NEGATIVA: a fonte corrige lançamentos, e julho/2026 fechou com −12 no dia 31.
 * Zerar esses dias esconderia a correção e faria o total do mês não bater.
 *
 * A série precisa estar ordenada por data e conter um único mês.
 */
export function fluxoDiario(serie: LeituraDiaria[]): Map<string, number> {
  const fluxo = new Map<string, number>();
  let anterior: number | null = null;

  for (const leitura of [...serie].sort((a, b) => a.data.localeCompare(b.data))) {
    fluxo.set(leitura.data, anterior === null ? leitura.acumulado : leitura.acumulado - anterior);
    anterior = leitura.acumulado;
  }

  return fluxo;
}

export interface DiaDoRitmo {
  data: string;
  /** 0 = domingo. */
  diaDaSemana: number;
  /** `null` quando o dia ainda não tem leitura. */
  realizado: number | null;
  meta: number;
  /** Acumulados até este dia, inclusive. `null` depois do último dia com dado. */
  realizadoAcumulado: number | null;
  metaAcumulada: number;
}

export interface Bloco {
  realizado: number;
  meta: number;
  /** realizado ÷ meta. `null` quando não há meta — não é 0%, é incalculável. */
  atingimento: number | null;
}

export interface Previsao {
  /** Fechamento projetado do mês. */
  valor: number;
  meta: number;
  atingimento: number | null;
  /**
   * Como foi projetado.
   * `curva-da-meta`: usa a diarização oficial como forma do mês — o melhor.
   * `curva-do-historico`: não há meta diarizada, então a forma vem dos meses
   *   anteriores do PRÓPRIO indicador. É dado real, e não chute.
   * `linear`: não há meta nem histórico. Sobra dividir pelos dias decorridos —
   *   e neste banco isso erra feio, porque o dia 1 sozinho vale quase um quinto
   *   do mês. A tela avisa quando cai aqui.
   */
  metodo: 'curva-da-meta' | 'curva-do-historico' | 'linear';
  /** Fatia do mês já decorrida segundo o método — o divisor da projeção. */
  fracaoDecorrida: number;
}

/** Peso de cada dia do mês, na ordem do calendário, somando 1. */
export type Curva = number[];

export interface Ritmo {
  /** yyyy-MM */
  mes: string;
  /** Último dia com leitura. `null` quando o mês ainda não tem nenhuma. */
  ultimoDiaComDado: string | null;
  dias: DiaDoRitmo[];
  mtd: Bloco;
  semana: Bloco;
  /** Início e fim da semana usada (segunda a domingo). */
  semanaDe: string | null;
  semanaAte: string | null;
  previsao: Previsao | null;
  metaDoMes: number;
  /**
   * Quanto a curva da meta se afasta da curva realizada, nos dias com dado.
   * 0 = idênticas; 1 = nada em comum. No histórico ficou entre 0,10 e 0,12.
   * `null` quando faltam meta ou realizado para comparar.
   */
  divergenciaDaCurva: number | null;
}

/** Todos os dias do mês, em yyyy-MM-dd. */
export function diasDoMes(mes: string): string[] {
  const [ano, numero] = mes.split('-').map(Number);
  const ultimo = new Date(ano, numero, 0).getDate();
  return Array.from(
    { length: ultimo },
    (_, i) => `${mes}-${String(i + 1).padStart(2, '0')}`,
  );
}

/** 0 = domingo. Calculado sem `new Date(texto)`, que desloca pelo fuso. */
export function diaDaSemana(data: string): number {
  const [ano, mes, dia] = data.split('-').map(Number);
  return new Date(ano, mes - 1, dia).getDay();
}

/** A segunda-feira da semana que contém a data. */
export function segundaDaSemana(data: string): string {
  const [ano, mes, dia] = data.split('-').map(Number);
  const d = new Date(ano, mes - 1, dia);
  // getDay(): 0 = domingo. Numa semana que começa na segunda, o domingo é o
  // sétimo dia, e não o primeiro — daí o 6 em vez de 0.
  const recuo = d.getDay() === 0 ? 6 : d.getDay() - 1;
  d.setDate(d.getDate() - recuo);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const soma = (valores: number[]) => valores.reduce((s, v) => s + v, 0);

/**
 * A forma média de um indicador, remontada para o mês pedido.
 *
 * Serve para projetar o fechamento de um indicador SEM meta cadastrada —
 * `matriculas_purepass` está assim desde abril de 2026. Antes disto, a previsão
 * dele caía na regra de três por dias decorridos, e o estudo dos meses mostra
 * que isso erra muito nesta base: o dia 1 carrega de 9% a 26% do mês.
 *
 * A forma é decomposta em três partes, do jeito que o estudo encontrou:
 *   · a fatia que cai no dia 1, que não é um dia comum;
 *   · a fatia do último dia, que fica perto de zero;
 *   · o miolo, distribuído pelo índice de cada dia da semana.
 *
 * Decompor importa porque os meses têm tamanhos e começos diferentes: fevereiro
 * tem 28 dias e agosto começa num sábado. Copiar a curva de um mês para o outro
 * dia a dia deslocaria todos os fins de semana.
 *
 * Devolve `null` quando o histórico não dá base — e aí é melhor não projetar do
 * que projetar mal.
 */
export function curvaDoHistorico(
  historico: Array<{ mes: string; realizadoPorDia: Map<string, number> }>,
  mesAlvo: string,
): Curva | null {
  const amostras = historico
    .map(({ mes, realizadoPorDia }) => {
      const datas = diasDoMes(mes);
      const valores = datas.map((d) => realizadoPorDia.get(d) ?? 0);
      const total = soma(valores);
      // Meses sem movimento, ou negativos por correção, não descrevem forma.
      if (total <= 0 || valores.length < 3) return null;

      const miolo = datas.slice(1, -1);
      const valoresDoMiolo = valores.slice(1, -1);
      const totalDoMiolo = soma(valoresDoMiolo);
      if (totalDoMiolo <= 0) return null;

      // Índice por dia da semana, dentro do miolo: 1,00 é o dia médio.
      const somaPorDow = Array(7).fill(0);
      const diasPorDow = Array(7).fill(0);
      miolo.forEach((data, i) => {
        const dow = diaDaSemana(data);
        somaPorDow[dow] += valoresDoMiolo[i];
        diasPorDow[dow] += 1;
      });
      const mediaDoDia = totalDoMiolo / miolo.length;
      const indicePorDow = somaPorDow.map((s, dow) =>
        diasPorDow[dow] > 0 ? s / diasPorDow[dow] / mediaDoDia : 1,
      );

      return {
        fatiaDoDia1: valores[0] / total,
        fatiaDoUltimo: valores[valores.length - 1] / total,
        indicePorDow,
      };
    })
    .filter((a): a is NonNullable<typeof a> => a !== null);

  if (amostras.length === 0) return null;

  const media = (pegar: (a: (typeof amostras)[number]) => number) =>
    soma(amostras.map(pegar)) / amostras.length;

  const fatiaDoDia1 = media((a) => a.fatiaDoDia1);
  const fatiaDoUltimo = media((a) => a.fatiaDoUltimo);
  const indicePorDow = Array.from({ length: 7 }, (_, dow) =>
    media((a) => a.indicePorDow[dow]),
  );

  const datas = diasDoMes(mesAlvo);
  const sobra = 1 - fatiaDoDia1 - fatiaDoUltimo;
  // Se dia 1 e último já respondem por tudo, não há miolo para distribuir e a
  // forma não serve.
  if (sobra <= 0) return null;

  const miolo = datas.slice(1, -1);
  const pesosDoMiolo = miolo.map((data) => Math.max(0, indicePorDow[diaDaSemana(data)]));
  const somaDosPesos = soma(pesosDoMiolo);
  if (somaDosPesos <= 0) return null;

  return [
    fatiaDoDia1,
    ...pesosDoMiolo.map((peso) => (peso / somaDosPesos) * sobra),
    fatiaDoUltimo,
  ];
}

export interface EntradaDoRitmo {
  /** yyyy-MM */
  mes: string;
  /** Fluxo diário já convertido, por data. */
  realizadoPorDia: Map<string, number>;
  /** Meta diarizada, por data. Vem de `daily_goals`. */
  metaPorDia: Map<string, number>;
  /**
   * Forma de reserva, para quando não houver meta diarizada. Sai de
   * `curvaDoHistorico`. Sem ela, um indicador sem meta cai na regra de três por
   * dias decorridos, que erra muito nesta base.
   */
  curvaDeReferencia?: Curva | null;
}

export function montarRitmo({
  mes,
  realizadoPorDia,
  metaPorDia,
  curvaDeReferencia,
}: EntradaDoRitmo): Ritmo {
  const datas = diasDoMes(mes);

  const comDado = datas.filter((d) => realizadoPorDia.has(d));
  const ultimoDiaComDado = comDado.length > 0 ? comDado[comDado.length - 1] : null;

  let realizadoAcum = 0;
  let metaAcum = 0;

  const dias: DiaDoRitmo[] = datas.map((data) => {
    const realizado = realizadoPorDia.has(data) ? realizadoPorDia.get(data)! : null;
    const meta = metaPorDia.get(data) ?? 0;

    if (realizado !== null) realizadoAcum += realizado;
    metaAcum += meta;

    return {
      data,
      diaDaSemana: diaDaSemana(data),
      realizado,
      meta,
      // Depois do último dia com leitura o acumulado não existe — deixar o
      // último valor repetido desenharia uma linha reta que parece estagnação.
      realizadoAcumulado: ultimoDiaComDado && data <= ultimoDiaComDado ? realizadoAcum : null,
      metaAcumulada: metaAcum,
    };
  });

  const metaDoMes = soma(dias.map((d) => d.meta));

  const ateAgora = ultimoDiaComDado
    ? dias.filter((d) => d.data <= ultimoDiaComDado)
    : [];

  const realizadoMtd = soma(ateAgora.map((d) => d.realizado ?? 0));
  const metaMtd = soma(ateAgora.map((d) => d.meta));

  // Semana corrente: segunda a domingo, contando só até o último dia com dado.
  const inicioDaSemana = ultimoDiaComDado ? segundaDaSemana(ultimoDiaComDado) : null;
  const daSemana = inicioDaSemana
    ? dias.filter((d) => d.data >= inicioDaSemana && d.data <= ultimoDiaComDado!)
    : [];

  return {
    mes,
    ultimoDiaComDado,
    dias,
    mtd: bloco(realizadoMtd, metaMtd),
    semana: bloco(
      soma(daSemana.map((d) => d.realizado ?? 0)),
      soma(daSemana.map((d) => d.meta)),
    ),
    semanaDe: daSemana.length > 0 ? daSemana[0].data : null,
    semanaAte: daSemana.length > 0 ? daSemana[daSemana.length - 1].data : null,
    previsao: preverFechamento({
      realizadoMtd,
      metaMtd,
      metaDoMes,
      diasDecorridos: ateAgora.length,
      totalDeDias: dias.length,
      curvaDeReferencia,
    }),
    metaDoMes,
    divergenciaDaCurva: divergencia(ateAgora),
  };
}

function bloco(realizado: number, meta: number): Bloco {
  return { realizado, meta, atingimento: meta > 0 ? realizado / meta : null };
}

function preverFechamento({
  realizadoMtd,
  metaMtd,
  metaDoMes,
  diasDecorridos,
  totalDeDias,
  curvaDeReferencia,
}: {
  realizadoMtd: number;
  metaMtd: number;
  metaDoMes: number;
  diasDecorridos: number;
  totalDeDias: number;
  curvaDeReferencia?: Curva | null;
}): Previsao | null {
  if (diasDecorridos === 0) return null;

  // O bom caminho: a curva da meta diz que fatia do mês já deveria ter passado.
  // Como o estudo mostrou que essa curva acompanha o comportamento real (10% a
  // 12% de divergência), ela é um divisor muito melhor que "dias decorridos".
  //
  // Dividir por dias decorridos, no dia 2 de um mês, projetaria o lote do dia 1
  // como se ele se repetisse todo dia — e o mês fecharia com o triplo da meta
  // no papel.
  if (metaDoMes > 0 && metaMtd > 0) {
    const fracao = metaMtd / metaDoMes;
    return {
      valor: realizadoMtd / fracao,
      meta: metaDoMes,
      atingimento: realizadoMtd / fracao / metaDoMes,
      metodo: 'curva-da-meta',
      fracaoDecorrida: fracao,
    };
  }

  // Sem meta diarizada, a forma dos meses anteriores do próprio indicador é o
  // melhor divisor disponível — é comportamento medido, não suposição.
  if (curvaDeReferencia && curvaDeReferencia.length === totalDeDias) {
    const fracao = soma(curvaDeReferencia.slice(0, diasDecorridos));
    if (fracao > 0) {
      return {
        valor: realizadoMtd / fracao,
        meta: metaDoMes,
        atingimento: metaDoMes > 0 ? realizadoMtd / fracao / metaDoMes : null,
        metodo: 'curva-do-historico',
        fracaoDecorrida: fracao,
      };
    }
  }

  const fracao = diasDecorridos / totalDeDias;
  return {
    valor: realizadoMtd / fracao,
    meta: metaDoMes,
    atingimento: metaDoMes > 0 ? realizadoMtd / fracao / metaDoMes : null,
    metodo: 'linear',
    fracaoDecorrida: fracao,
  };
}

/**
 * Distância entre a curva da meta e a curva realizada, nos dias com dado.
 *
 * Compara FORMAS, não volumes: cada dia vira sua fatia do próprio total, e a
 * conta é metade da soma dos desvios absolutos. Assim uma rede que bateu 120%
 * da meta todo dia tem divergência zero — ela seguiu a curva, só que num degrau
 * acima. O que a métrica pega é a meta esperar movimento na terça e ele vir na
 * quinta.
 */
function divergencia(dias: DiaDoRitmo[]): number | null {
  const totalReal = soma(dias.map((d) => d.realizado ?? 0));
  const totalMeta = soma(dias.map((d) => d.meta));
  if (totalReal <= 0 || totalMeta <= 0) return null;

  const desvio = soma(
    dias.map((d) => Math.abs((d.realizado ?? 0) / totalReal - d.meta / totalMeta)),
  );
  return desvio / 2;
}
