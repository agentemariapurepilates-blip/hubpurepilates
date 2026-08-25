/**
 * Traduz o Cérebro e o diagnóstico para o texto que a IA lê.
 *
 * É aqui que "manual" vira "contexto de modelo". O manual continua sendo escrito
 * uma vez só, em `dados/cerebro.ts`; esta função só o serializa. Se alguém
 * escrever regra de operação direto no prompt, a tela do Cérebro passa a mentir.
 *
 * O prompt é montado no navegador e pode ser copiado inteiro pela tela. Isso é
 * de propósito: dá para colar em qualquer IA hoje, sem depender de a função de
 * borda estar publicada, e dá para conferir exatamente o que o modelo recebeu
 * quando a resposta parecer estranha.
 */

import { EIXOS, FONTES, FORMATOS, PARAMETROS, REGRAS } from '../dados/cerebro';
import type { Diagnostico, LinhaDeMidia } from './analise';

const real = (valor: number) =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const num = (valor: number) => valor.toLocaleString('pt-BR', { maximumFractionDigits: 0 });

/** O manual, em texto corrido. É a parte do prompt que não depende de dado. */
export function montarManual(): string {
  const linhas: string[] = [];

  linhas.push('# Como a mídia paga da Pure Pilates deveria funcionar');
  linhas.push('');
  linhas.push(
    'Este é o manual da operação. Ele descreve a intenção de cada campanha. Use-o para julgar ' +
      'os números: um custo alto numa frente pode ser normal e numa outra pode ser o problema ' +
      'principal.',
  );
  linhas.push('');

  for (const eixo of EIXOS) {
    linhas.push(`## Eixo: ${eixo.nome}`);
    linhas.push(eixo.proposito);
    linhas.push('');

    for (const frente of eixo.frentes) {
      linhas.push(`### ${frente.nome}`);
      linhas.push(`- Objetivo: ${frente.objetivo}`);
      linhas.push(`- Plataformas: ${frente.plataformas.join(', ')}`);
      linhas.push(`- Público: ${frente.publico}`);
      linhas.push(`- O que conta como resultado: ${frente.resultado}`);
      linhas.push(`- KPI principal: ${frente.kpi.toUpperCase()}`);
      linhas.push(
        `- Faixa de referência: ${
          frente.faixa
            ? `bom até ${real(frente.faixa.bom)}, atenção até ${real(frente.faixa.atencao)} (${frente.faixa.origem})`
            : 'a sede ainda não definiu meta. Compare com a mediana da própria frente no período e diga que a meta não existe.'
        }`,
      );
      linhas.push(`- Responsável pelo número: ${frente.responsavel}`);
      linhas.push(`- Precisa estar amarrada a uma unidade: ${frente.exigeUnidade ? 'sim' : 'não'}`);
      linhas.push('- Regras de operação:');
      frente.regras.forEach((regra) => linhas.push(`  - ${regra}`));
      linhas.push('- Erros comuns:');
      frente.errosComuns.forEach((erro) => linhas.push(`  - ${erro}`));
      linhas.push('');
    }
  }

  linhas.push('## Como os nomes são construídos');
  for (const formato of FORMATOS) {
    linhas.push(`- ${formato.onde} — \`${formato.modelo}\` (ex.: ${formato.exemplo}). ${formato.explicacao}`);
  }
  linhas.push('');

  linhas.push('## O que cada fonte de dados responde');
  for (const fonte of FONTES) {
    linhas.push(`- ${fonte.nome}: responde "${fonte.responde}" e NÃO responde "${fonte.naoResponde}".`);
  }
  linhas.push('');

  linhas.push('## Regras que já foram conferidas automaticamente');
  linhas.push(
    'As verificações abaixo rodam antes de você. Os achados chegam prontos — não refaça a ' +
      'conta, use-a.',
  );
  for (const regra of REGRAS) {
    linhas.push(`- ${regra.titulo} (${regra.gravidade}): ${regra.porque}`);
  }
  linhas.push('');
  linhas.push(
    `Parâmetros usados: cobra-se resultado a partir de ${num(PARAMETROS.impressoesParaCobrarResultado)} ` +
      `impressões; custo vira alerta acima de ${PARAMETROS.vezesAcimaDaMediana}× a mediana da frente; ` +
      `só entra na comparação quem gastou ao menos ${real(PARAMETROS.gastoMinimoParaComparar)}.`,
  );

  return linhas.join('\n');
}

/** O retrato do período: totais, frentes, achados e o que está faltando. */
export function montarDados(diagnostico: Diagnostico, linhas: LinhaDeMidia[]): string {
  const texto: string[] = [];

  texto.push(`# Dados do período ${diagnostico.periodo.de} a ${diagnostico.periodo.ate}`);
  texto.push('');

  texto.push('## Fontes');
  for (const fonte of diagnostico.fontes) {
    texto.push(`- ${fonte.nome}: ${fonte.conectada ? 'CONECTADA' : 'NÃO CONECTADA'} — ${fonte.observacao}`);
  }
  texto.push('');

  texto.push('## Totais');
  texto.push(`- Conjuntos com dado: ${diagnostico.totais.conjuntos}`);
  texto.push(`- Investimento: ${real(diagnostico.totais.gasto)}`);
  texto.push(`- Resultados: ${num(diagnostico.totais.resultados)}`);
  texto.push(`- Impressões: ${num(diagnostico.totais.impressoes)}`);
  texto.push(`- Cliques: ${num(diagnostico.totais.cliques)}`);
  texto.push(
    `- Custo por resultado: ${
      diagnostico.totais.custoPorResultado === null
        ? 'não calculável (zero resultado)'
        : real(diagnostico.totais.custoPorResultado)
    }`,
  );
  texto.push('');

  texto.push('## Por frente do manual');
  texto.push('| Eixo | Frente | Conjuntos | Investimento | Resultados | Custo/resultado | Mediana |');
  texto.push('| --- | --- | --- | --- | --- | --- | --- |');
  for (const frente of diagnostico.porFrente) {
    texto.push(
      `| ${frente.eixoNome} | ${frente.frenteNome} | ${frente.conjuntos} | ${real(frente.gasto)} | ` +
        `${num(frente.resultados)} | ${frente.custoPorResultado === null ? '—' : real(frente.custoPorResultado)} | ` +
        `${frente.medianaDoCusto === null ? '—' : real(frente.medianaDoCusto)} |`,
    );
  }
  texto.push('');

  if (diagnostico.foraDoManual.length > 0) {
    texto.push('## Campanhas com gasto que o manual não cobre');
    texto.push(
      'Estas campanhas existem na conta e não se encaixam em nenhuma frente. Diga o que fazer ' +
        'com elas: incluir no manual ou desligar.',
    );
    diagnostico.foraDoManual.forEach((nome) => texto.push(`- ${nome}`));
    texto.push('');
  }

  texto.push('## Achados da verificação automática');
  if (diagnostico.achados.length === 0) {
    texto.push('Nenhum. Diga isso com todas as letras em vez de procurar um problema.');
  } else {
    for (const achadoAtual of diagnostico.achados) {
      texto.push(`- [${achadoAtual.gravidade}] ${achadoAtual.titulo} — ${achadoAtual.alvo}: ${achadoAtual.detalhe}`);
    }
  }
  texto.push('');

  texto.push('## Conjuntos, do que mais gastou para o que menos gastou');
  texto.push('| Conjunto | Campanha | Status | Unidade | Investimento | Resultados | Custo/result. | Impressões |');
  texto.push('| --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const linha of linhas) {
    texto.push(
      `| ${linha.conjunto} | ${linha.campanha} | ${linha.status ?? '—'} | ` +
        `${linha.unidadeVinculada?.nome ?? 'SEM VÍNCULO'} | ${real(linha.gasto)} | ${num(linha.resultados)} | ` +
        `${linha.resultados > 0 ? real(linha.gasto / linha.resultados) : '—'} | ${num(linha.impressoes)} |`,
    );
  }

  return texto.join('\n');
}

/** A tarefa. Curta de propósito: o que segura a resposta é o manual, não isto. */
export const INSTRUCAO = `# Sua tarefa

Escreva o relatório de mídia paga do período, em português do Brasil, para a diretoria da Pure
Pilates ler em cinco minutos.

Estrutura:
1. **O que aconteceu** — 3 a 5 linhas. Investimento, resultados, custo por resultado, e a
   comparação com a frente que puxou o número.
2. **O que precisa de decisão** — no máximo 5 itens, cada um com o que aconteceu, quanto custa
   deixar como está, e a ação. Comece pelos achados de gravidade alta.
3. **O que não dá para afirmar** — as fontes que faltam e as perguntas que ficam sem resposta
   por causa disso.
4. **Próximo passo** — uma frase, uma ação, um responsável.

Regras que valem mais que a estrutura:
- Não invente número. Se não está nos dados acima, escreva que não está.
- Não trate ausência de dado como resultado zero. Frente sem dado é uma pergunta, não um fracasso.
- Não compare custo entre frentes diferentes sem dizer que elas compram coisas diferentes.
- Não sugira "otimizar criativos" nem nada que sirva para qualquer conta: toda recomendação
  precisa citar o conjunto ou a frente pelo nome.
- Se uma fonte prevista não está conectada, isso entra no relatório antes de qualquer conclusão
  sobre o desempenho geral.
- Nada de emoji, nada de negrito decorativo, nada de "insights valiosos".`;

/** O prompt inteiro, pronto para copiar ou enviar. */
export function montarPrompt(diagnostico: Diagnostico, linhas: LinhaDeMidia[]): string {
  return [montarManual(), montarDados(diagnostico, linhas), INSTRUCAO].join('\n\n---\n\n');
}
