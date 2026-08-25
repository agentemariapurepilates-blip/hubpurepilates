/**
 * Transforma o diagnóstico em texto de relatório, em português corrente.
 *
 * POR QUE ISTO NÃO É TRABALHO DA IA: as quatro seções abaixo são as mesmas que
 * o prompt pede ao modelo. Escrevê-las aqui, deterministicamente, faz a tela
 * virar um relatório legível mesmo com a função da IA fora do ar — e dá um
 * padrão de comparação: se o texto do modelo discordar deste, um dos dois está
 * errado e dá para ver qual.
 *
 * A IA continua valendo a pena pelo que ela faz melhor: priorizar, ligar dois
 * achados que ninguém tinha ligado, e escrever a recomendação. O que é conta,
 * é conta.
 */

import type { Diagnostico } from './analise';

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

/** "2026-05-01" → "1º de maio de 2026". Sem `new Date`, que desloca o fuso. */
export function porExtenso(data: string): string {
  const [ano, mes, dia] = data.split('-').map(Number);
  if (!ano || !mes || !dia) return data;
  const numero = dia === 1 ? '1º' : String(dia);
  return `${numero} de ${MESES[mes - 1]} de ${ano}`;
}

const real = (valor: number) =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const inteiro = (valor: number) => valor.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
const porcento = (valor: number) => `${(valor * 100).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%`;

export interface SecaoDoRelatorio {
  numero: number;
  titulo: string;
  /** A pergunta que a seção responde, para quem bate o olho e não lê. */
  pergunta: string;
  paragrafos: string[];
}

/** O que aconteceu no período, em três frases. */
function oQueAconteceu(d: Diagnostico): SecaoDoRelatorio {
  const paragrafos: string[] = [];
  const periodo = `Entre ${porExtenso(d.periodo.de)} e ${porExtenso(d.periodo.ate)}`;

  if (d.totais.conjuntos === 0) {
    paragrafos.push(
      `${periodo} não houve um único conjunto com dado no Hub. Isso não quer dizer que a rede ` +
        'não investiu: quer dizer que nada chegou até aqui. Antes de qualquer conclusão, é a ' +
        'carga de métricas que precisa ser conferida.',
    );
    return { numero: 1, titulo: 'O que aconteceu', pergunta: 'Quanto foi investido e o que voltou?', paragrafos };
  }

  paragrafos.push(
    `${periodo} a rede investiu ${real(d.totais.gasto)} em mídia paga e recebeu ` +
      `${inteiro(d.totais.resultados)} resultados, a ` +
      `${d.totais.custoPorResultado === null ? 'custo não calculável' : real(d.totais.custoPorResultado)} cada. ` +
      `${d.totais.conjuntos === 1 ? 'Foi 1 conjunto de anúncio' : `Foram ${inteiro(d.totais.conjuntos)} conjuntos de anúncio`}` +
      ` e ${inteiro(d.totais.impressoes)} impressões.`,
  );

  // A frente que domina o gasto é quase sempre a história do período.
  const comGasto = d.porFrente.filter((f) => f.gasto > 0).sort((a, b) => b.gasto - a.gasto);
  if (comGasto.length === 1) {
    const unica = comGasto[0];
    paragrafos.push(
      `Todo esse investimento saiu de uma única frente: ${unica.frenteNome}, do eixo ` +
        `${unica.eixoNome}. O número acima é o número dela, e não o da mídia da rede — as outras ` +
        `${d.porFrente.length - 1} frentes do manual não tiveram nenhum dado no período.`,
    );
  } else if (comGasto.length > 1) {
    const maior = comGasto[0];
    const fatia = maior.gasto / d.totais.gasto;
    paragrafos.push(
      `A frente que mais consumiu verba foi ${maior.frenteNome} (${maior.eixoNome}), com ` +
        `${real(maior.gasto)} — ${porcento(fatia)} do total, a ` +
        `${maior.custoPorResultado === null ? 'sem resultado' : `${real(maior.custoPorResultado)} por resultado`}. ` +
        `Ao todo, ${comGasto.length} das ${d.porFrente.length} frentes do manual tiveram movimento.`,
    );

    const maisCara = comGasto
      .filter((f) => f.custoPorResultado !== null)
      .sort((a, b) => (b.custoPorResultado ?? 0) - (a.custoPorResultado ?? 0))[0];
    const maisBarata = comGasto
      .filter((f) => f.custoPorResultado !== null)
      .sort((a, b) => (a.custoPorResultado ?? 0) - (b.custoPorResultado ?? 0))[0];

    if (maisCara && maisBarata && maisCara.frenteId !== maisBarata.frenteId) {
      paragrafos.push(
        `O resultado mais caro veio de ${maisCara.frenteNome}, a ${real(maisCara.custoPorResultado!)}, ` +
          `e o mais barato de ${maisBarata.frenteNome}, a ${real(maisBarata.custoPorResultado!)}. ` +
          'Elas não competem entre si: cada frente compra uma coisa diferente, e um lead de RH ' +
          'não vale o mesmo que uma assinatura vendida.',
      );
    }
  }

  return {
    numero: 1,
    titulo: 'O que aconteceu',
    pergunta: 'Quanto foi investido e o que voltou?',
    paragrafos,
  };
}

/** Os achados graves, resumidos em prosa antes da lista detalhada. */
function oQuePrecisaDeDecisao(d: Diagnostico): SecaoDoRelatorio {
  const paragrafos: string[] = [];
  const altas = d.achados.filter((a) => a.gravidade === 'alta');
  const medias = d.achados.filter((a) => a.gravidade === 'media');

  if (d.achados.length === 0) {
    paragrafos.push(
      'Nenhuma regra do manual foi violada no período. Não há decisão pendente vinda da ' +
        'verificação automática.',
    );
    return {
      numero: 2,
      titulo: 'O que precisa de decisão',
      pergunta: 'O que está errado e quanto custa deixar como está?',
      paragrafos,
    };
  }

  const dinheiroEmJogo = d.achados
    .filter((a) => a.gravidade === 'alta')
    .reduce((soma, a) => soma + a.gasto, 0);

  paragrafos.push(
    `A verificação encontrou ${d.achados.length} ${d.achados.length === 1 ? 'ponto' : 'pontos'}: ` +
      `${altas.length} para resolver agora e ${medias.length} para olhar esta semana.` +
      (dinheiroEmJogo > 0
        ? ` Os pontos graves envolvem ${real(dinheiroEmJogo)} de investimento já feito.`
        : ''),
  );

  const semUnidade = d.achados.filter((a) => a.regraId === 'conjunto-sem-unidade');
  if (semUnidade.length > 0) {
    const total = semUnidade.reduce((soma, a) => soma + a.gasto, 0);
    paragrafos.push(
      `${semUnidade.length} ${semUnidade.length === 1 ? 'conjunto gastou' : 'conjuntos gastaram'} ` +
        `${real(total)} sem estar ${semUnidade.length === 1 ? 'vinculado' : 'vinculados'} a nenhuma ` +
        'unidade. Esse dinheiro não aparece no painel ' +
        'de nenhum franqueado, e ninguém está cobrando o resultado dele.',
    );
  }

  const semResultado = d.achados.filter((a) => a.regraId === 'gasto-sem-resultado');
  if (semResultado.length > 0) {
    paragrafos.push(
      `${semResultado.length} ${semResultado.length === 1 ? 'conjunto teve' : 'conjuntos tiveram'} ` +
        'impressão suficiente para o Meta aprender e mesmo assim não gerou nenhum resultado. ' +
        'Nesse ponto não é mais variação: é público, oferta ou formulário.',
    );
  }

  const caros = d.achados.filter((a) => a.regraId === 'custo-fora-da-faixa');
  if (caros.length > 0) {
    paragrafos.push(
      `${caros.length} ${caros.length === 1 ? 'conjunto está' : 'conjuntos estão'} com custo por ` +
        'resultado muito acima dos pares da mesma frente, no mesmo período. A comparação é entre ' +
        'iguais de propósito — comparar com o histórico da própria unidade esconderia uma piora ' +
        'que atingiu a rede inteira.',
    );
  }

  return {
    numero: 2,
    titulo: 'O que precisa de decisão',
    pergunta: 'O que está errado e quanto custa deixar como está?',
    paragrafos,
  };
}

/** Os limites do relatório, ditos antes que alguém tire conclusão demais. */
function oQueNaoDaParaAfirmar(d: Diagnostico): SecaoDoRelatorio {
  const paragrafos: string[] = [];
  const ausentes = d.fontes.filter((f) => !f.conectada);

  if (ausentes.length > 0) {
    paragrafos.push(
      `Esta análise usou ${d.fontes.length - ausentes.length} de ${d.fontes.length} fontes. ` +
        `Falta ${ausentes.map((f) => f.nome).join(' e ')}. ` +
        'Enquanto isso, o relatório sabe quanto custou o lead e não sabe o que aconteceu depois ' +
        'do clique nem quanto a busca no Google custou.',
    );
  } else {
    paragrafos.push('As três fontes previstas no manual estão conectadas.');
  }

  const semDado = d.porFrente.filter((f) => f.semDado);
  if (semDado.length > 0) {
    paragrafos.push(
      `${semDado.length} das ${d.porFrente.length} frentes do manual não tiveram nenhum dado: ` +
        `${semDado.map((f) => f.frenteNome).join(', ')}. ` +
        'Ausência de dado não é resultado zero. Ou elas pararam de rodar, ou o dado não está ' +
        'chegando ao Hub — e a segunda hipótese tem uma causa conhecida: a carga do Meta só ' +
        'busca conjunto vinculado a uma unidade.',
    );
  }

  if (d.foraDoManual.length > 0) {
    paragrafos.push(
      `${d.foraDoManual.length} campanhas com gasto não se encaixam em nenhuma frente do manual ` +
        `(${d.foraDoManual.join(', ')}) e por isso ficaram fora da tabela por frente. O total ` +
        'geral continua incluindo elas.',
    );
  }

  return {
    numero: 3,
    titulo: 'O que não dá para afirmar',
    pergunta: 'Que perguntas este relatório não responde?',
    paragrafos,
  };
}

/** Uma ação, escolhida pelo achado mais grave e mais caro. */
function proximoPasso(d: Diagnostico): SecaoDoRelatorio {
  const paragrafos: string[] = [];
  const ausentes = d.fontes.filter((f) => !f.conectada);
  const semUnidade = d.achados.filter((a) => a.regraId === 'conjunto-sem-unidade');
  const semDado = d.porFrente.filter((f) => f.semDado);

  // A ordem é de causa, não de gravidade: não adianta discutir custo por lead
  // de uma frente enquanto seis frentes não têm dado nenhum.
  if (semDado.length > d.porFrente.length / 2) {
    paragrafos.push(
      `Vincular os conjuntos das frentes sem dado a suas unidades, em Minha Área › Mídia ` +
        'adicional. Enquanto a maioria das frentes estiver sem dado, nenhuma conclusão sobre o ' +
        'total da rede se sustenta — e essa é a única correção que destrava todas as outras.',
    );
  } else if (semUnidade.length > 0) {
    paragrafos.push(
      `Vincular à unidade os ${semUnidade.length} conjuntos que gastaram sem vínculo, para que o ` +
        'investimento apareça no painel de quem paga por ele.',
    );
  } else if (d.achados.some((a) => a.gravidade === 'alta')) {
    const primeiro = d.achados.find((a) => a.gravidade === 'alta')!;
    paragrafos.push(`Resolver o ponto mais grave: ${primeiro.titulo} — ${primeiro.alvo}.`);
  } else if (ausentes.length > 0) {
    paragrafos.push(
      `Integrar ${ausentes.map((f) => f.nome).join(' e ')} ao Hub, para que a próxima análise ` +
        'cubra o caminho inteiro e não só o custo do clique.',
    );
  } else {
    paragrafos.push('Manter o acompanhamento. Nenhuma correção está pendente.');
  }

  return {
    numero: 4,
    titulo: 'Próximo passo',
    pergunta: 'O que fazer primeiro?',
    paragrafos,
  };
}

export function montarRelatorio(d: Diagnostico): SecaoDoRelatorio[] {
  return [oQueAconteceu(d), oQuePrecisaDeDecisao(d), oQueNaoDaParaAfirmar(d), proximoPasso(d)];
}
