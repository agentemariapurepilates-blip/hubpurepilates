/**
 * Diagnóstico determinístico da mídia paga.
 *
 * Roda inteiro no navegador, sem IA e sem rede: dado o período e as linhas
 * normalizadas, aplica as REGRAS do manual e devolve os achados.
 *
 * POR QUE ISTO EXISTE SEPARADO DA IA: o texto da IA é bom para explicar e para
 * priorizar, e é ruim para garantir. Uma verificação que precisa acontecer
 * TODA vez — "este conjunto gastou R$ 1.300 e não tem unidade vinculada" — não
 * pode depender de o modelo ter reparado. A IA recebe estes achados prontos e
 * escreve em cima deles; ela não os descobre.
 */

import {
  FRENTES,
  FONTES,
  PARAMETROS,
  REGRAS,
  type Gravidade,
  type Plataforma,
} from '../dados/cerebro';
import { classificarFrente, interpretarCampanha, interpretarConjunto, normalizar } from './nomenclatura';

/** Uma linha por conjunto, já somada no período. Formato comum às três fontes. */
export interface LinhaDeMidia {
  plataforma: Plataforma;
  conjuntoId: string;
  conjunto: string;
  campanha: string;
  /** Status do conjunto na plataforma: ACTIVE, PAUSED... */
  status: string | null;
  unidadeVinculada: { id: string; nome: string } | null;
  /** Dias com dado no período. */
  dias: number;
  gasto: number;
  resultados: number;
  impressoes: number;
  cliques: number;
}

export interface Achado {
  regraId: string;
  gravidade: Gravidade;
  titulo: string;
  /** O caso concreto, com números. */
  detalhe: string;
  /** Conjunto, campanha ou frente a que o achado se refere. */
  alvo: string;
  /**
   * O alvo é um nome do gerenciador (conjunto, campanha), e não uma frente do
   * manual. A tela usa isto para escolher a fonte: nome de conjunto é código e
   * pede monoespaçada; "Aula experimental › DCO" é português e não pede.
   */
  alvoTecnico: boolean;
  /** Dinheiro envolvido, quando faz sentido — usado para ordenar. */
  gasto: number;
}

export interface ResumoDaFrente {
  frenteId: string;
  frenteNome: string;
  eixoNome: string;
  conjuntos: number;
  gasto: number;
  resultados: number;
  impressoes: number;
  cliques: number;
  /** Custo por resultado. `null` quando não houve resultado no período. */
  custoPorResultado: number | null;
  /** Mediana do custo por resultado entre os conjuntos comparáveis da frente. */
  medianaDoCusto: number | null;
  /** A frente está no manual mas não teve nenhuma linha no período. */
  semDado: boolean;
}

export interface Diagnostico {
  periodo: { de: string; ate: string };
  totais: {
    gasto: number;
    resultados: number;
    impressoes: number;
    cliques: number;
    custoPorResultado: number | null;
    conjuntos: number;
  };
  porFrente: ResumoDaFrente[];
  /** Campanhas ativas na conta que nenhuma frente do manual cobre. */
  foraDoManual: string[];
  achados: Achado[];
  fontes: Array<{ id: Plataforma; nome: string; conectada: boolean; observacao: string }>;
}

const regraPor = (id: string) => REGRAS.find((r) => r.id === id)!;

function achado(
  regraId: string,
  alvo: string,
  detalhe: string,
  gasto = 0,
  alvoTecnico = true,
): Achado {
  const regra = regraPor(regraId);
  return {
    regraId,
    gravidade: regra.gravidade,
    titulo: regra.titulo,
    detalhe,
    alvo,
    alvoTecnico,
    gasto,
  };
}

export function mediana(valores: number[]): number | null {
  if (valores.length === 0) return null;
  const ordenados = [...valores].sort((a, b) => a - b);
  const meio = Math.floor(ordenados.length / 2);
  return ordenados.length % 2 === 0
    ? (ordenados[meio - 1] + ordenados[meio]) / 2
    : ordenados[meio];
}

const dinheiro = (valor: number) =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const inteiro = (valor: number) => valor.toLocaleString('pt-BR', { maximumFractionDigits: 0 });

export interface OpcoesDaAnalise {
  de: string;
  ate: string;
  /** Quais fontes estão realmente conectadas. O que não estiver aqui vira achado. */
  fontesConectadas: Plataforma[];
}

export function diagnosticar(linhas: LinhaDeMidia[], opcoes: OpcoesDaAnalise): Diagnostico {
  const achados: Achado[] = [];

  // --- classificação -------------------------------------------------------
  const classificadas = linhas.map((linha) => ({
    ...linha,
    classificacao: classificarFrente(linha.campanha, linha.conjunto),
  }));

  // --- resumo por frente ---------------------------------------------------
  const porFrente: ResumoDaFrente[] = FRENTES.map((frente) => {
    const doGrupo = classificadas.filter((l) => l.classificacao.frenteId === frente.id);

    const gasto = doGrupo.reduce((s, l) => s + l.gasto, 0);
    const resultados = doGrupo.reduce((s, l) => s + l.resultados, 0);

    const comparaveis = doGrupo
      .filter((l) => l.gasto >= PARAMETROS.gastoMinimoParaComparar && l.resultados > 0)
      .map((l) => l.gasto / l.resultados);

    return {
      frenteId: frente.id,
      frenteNome: frente.nome,
      eixoNome: frente.eixoNome,
      conjuntos: doGrupo.length,
      gasto,
      resultados,
      impressoes: doGrupo.reduce((s, l) => s + l.impressoes, 0),
      cliques: doGrupo.reduce((s, l) => s + l.cliques, 0),
      custoPorResultado: resultados > 0 ? gasto / resultados : null,
      medianaDoCusto: mediana(comparaveis),
      semDado: doGrupo.length === 0,
    };
  });

  // --- regra: frente do manual sem nenhum dado -----------------------------
  //
  // Um achado só para todas as frentes vazias, e não um por frente. Quando seis
  // das sete estão sem dado, a causa é uma — a carga não trouxe — e seis cartões
  // idênticos empurram os achados de verdade para o fim da lista.
  const semDado = porFrente.filter((resumo) => resumo.semDado);
  if (semDado.length > 0) {
    achados.push(
      achado(
        'frente-sem-dado',
        semDado.map((resumo) => resumo.frenteNome).join(', '),
        `${semDado.length} de ${porFrente.length} frentes do manual não tiveram nenhum conjunto ` +
          'com dado no período. Ou elas pararam de rodar, ou o dado não está chegando ao Hub — a ' +
          'carga de métricas do Meta só busca conjunto vinculado a uma unidade. Enquanto isso não ' +
          'for respondido, o total desta tela não é o total da rede.',
        0,
        false,
      ),
    );
  }

  // --- regra: fonte prevista e não conectada -------------------------------
  const fontes = FONTES.map((fonte) => {
    const conectada = opcoes.fontesConectadas.includes(fonte.id);
    if (!conectada) {
      achados.push(
        achado(
          'fonte-ausente',
          fonte.nome,
          `${fonte.nome} não está integrado ao Hub. Sem ele falta a resposta de "${fonte.responde}" ` +
            'e nenhum número desta tela cobre esse pedaço.',
          0,
          false,
        ),
      );
    }
    return {
      id: fonte.id,
      nome: fonte.nome,
      conectada,
      // Conectada: o que ela traz. Ausente: o que deixa de ser respondido — e
      // não "ainda não integrado", que só repete o título do aviso.
      observacao: conectada ? fonte.responde : `Fica sem resposta: ${fonte.responde}`,
    };
  });

  // --- regras por conjunto -------------------------------------------------
  const nomesAtivos = new Map<string, number>();

  for (const linha of classificadas) {
    const frente = FRENTES.find((f) => f.id === linha.classificacao.frenteId);
    const rotulo = `${linha.conjunto}`;

    if (ativo(linha.status)) {
      const chave = normalizar(linha.conjunto);
      nomesAtivos.set(chave, (nomesAtivos.get(chave) ?? 0) + 1);
    }

    if (frente?.exigeUnidade && linha.unidadeVinculada === null && linha.gasto > 0) {
      achados.push(
        achado(
          'conjunto-sem-unidade',
          rotulo,
          `Gastou ${dinheiro(linha.gasto)} no período e não está vinculado a nenhuma unidade no ` +
            `Hub. A frente ${frente.nome} é medida por unidade, então este gasto não aparece em ` +
            'painel nenhum.',
          linha.gasto,
        ),
      );
    }

    if (linha.impressoes >= PARAMETROS.impressoesParaCobrarResultado && linha.resultados === 0) {
      achados.push(
        achado(
          'gasto-sem-resultado',
          rotulo,
          `${inteiro(linha.impressoes)} impressões e ${dinheiro(linha.gasto)} gastos, zero ` +
            'resultado. Acima de ' +
            `${inteiro(PARAMETROS.impressoesParaCobrarResultado)} impressões isso não é variação: ` +
            'é público, oferta ou formulário.',
          linha.gasto,
        ),
      );
    }

    const nomeCampanha = interpretarCampanha(linha.campanha);
    const nomeConjunto = interpretarConjunto(linha.conjunto);

    if (!nomeCampanha.noPadrao && !nomeCampanha.espacamentoTorto) {
      achados.push(
        achado(
          'nome-fora-do-padrao',
          linha.campanha,
          'O nome da campanha não segue "[marca] tipo | contexto | público". Sem isso ela não ' +
            'entra em nenhum agrupamento do relatório.',
          linha.gasto,
        ),
      );
    }

    if (nomeConjunto.formato === null) {
      achados.push(
        achado(
          'nome-fora-do-padrao',
          rotulo,
          'O nome do conjunto não casa com nenhum dos formatos declarados no manual.',
          linha.gasto,
        ),
      );
    }

    if (nomeConjunto.copia) {
      achados.push(
        achado(
          'conjunto-duplicado',
          rotulo,
          'O nome termina em "— Cópia": duplicata criada no braço dentro do gerenciador. ' +
            'Verifique se as duas versões estão rodando ao mesmo tempo.',
          linha.gasto,
        ),
      );
    }
  }

  // --- regra: conjuntos ativos com o mesmo nome ----------------------------
  for (const [chave, quantidade] of nomesAtivos) {
    if (quantidade < 2) continue;
    const exemplo = classificadas.find((l) => normalizar(l.conjunto) === chave);
    achados.push(
      achado(
        'conjunto-duplicado',
        exemplo?.conjunto ?? chave,
        `${quantidade} conjuntos ativos com exatamente este nome. Eles dividem verba e ` +
          'aprendizado, e cada um aprende metade.',
        exemplo?.gasto ?? 0,
      ),
    );
  }

  // --- regra: custo muito acima dos pares da mesma frente ------------------
  for (const resumo of porFrente) {
    if (resumo.medianaDoCusto === null) continue;
    const teto = resumo.medianaDoCusto * PARAMETROS.vezesAcimaDaMediana;

    for (const linha of classificadas) {
      if (linha.classificacao.frenteId !== resumo.frenteId) continue;
      if (linha.gasto < PARAMETROS.gastoMinimoParaComparar || linha.resultados === 0) continue;

      const custo = linha.gasto / linha.resultados;
      if (custo <= teto) continue;

      achados.push(
        achado(
          'custo-fora-da-faixa',
          linha.conjunto,
          `${dinheiro(custo)} por resultado, contra ${dinheiro(resumo.medianaDoCusto)} de mediana ` +
            `da frente ${resumo.frenteNome} no mesmo período — ` +
            `${(custo / resumo.medianaDoCusto).toFixed(1)}× a mediana.`,
          linha.gasto,
        ),
      );
    }
  }

  // --- campanhas que o manual não cobre ------------------------------------
  const foraDoManual = [
    ...new Set(
      classificadas.filter((l) => l.classificacao.frenteId === null).map((l) => l.campanha),
    ),
  ].sort();

  const gasto = linhas.reduce((s, l) => s + l.gasto, 0);
  const resultados = linhas.reduce((s, l) => s + l.resultados, 0);

  const ordemDaGravidade: Record<Gravidade, number> = { alta: 0, media: 1, baixa: 2 };

  return {
    periodo: { de: opcoes.de, ate: opcoes.ate },
    totais: {
      gasto,
      resultados,
      impressoes: linhas.reduce((s, l) => s + l.impressoes, 0),
      cliques: linhas.reduce((s, l) => s + l.cliques, 0),
      custoPorResultado: resultados > 0 ? gasto / resultados : null,
      conjuntos: linhas.length,
    },
    porFrente,
    foraDoManual,
    // Grave primeiro; dentro da mesma gravidade, o que envolve mais dinheiro.
    achados: achados.sort(
      (a, b) => ordemDaGravidade[a.gravidade] - ordemDaGravidade[b.gravidade] || b.gasto - a.gasto,
    ),
    fontes,
  };
}

function ativo(status: string | null): boolean {
  return normalizar(status ?? '') === 'active';
}
