#!/usr/bin/env node
/**
 * Gera `src/features/colaborador/indicadores/dados/pdm.ts` a partir do texto
 * exportado da planilha de PDM da Rise.
 *
 * Uso:
 *   node scripts/gera-pdm.mjs <arquivo-txt-do-pdm>
 *
 * ────────────────────────────────────────────────────────────────────────────
 * COMO UMA ABA DE MÊS É RECONHECIDA
 * ────────────────────────────────────────────────────────────────────────────
 * O texto exportado NÃO traz o nome das abas — é uma sequência de tabelas
 * markdown, uma atrás da outra. O que separa um mês do outro é a linha de
 * cabeçalho, que sempre tem "TIPO | LOCALIDADE | ESTRATÉGIA | ETAPA 4S". Logo
 * abaixo dela vem a linha de totais, e depois as campanhas.
 *
 * A ORDEM das abas é o que dá o mês, e não o rótulo da coluna de verba: a aba
 * de junho tem "MAIO" escrito no cabeçalho da verba, resquício de quem copiou
 * o mês anterior para montar o novo. Confiar nesse rótulo colocaria junho
 * inteiro em maio.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * O QUE É LINHA DE CAMPANHA E O QUE NÃO É
 * ────────────────────────────────────────────────────────────────────────────
 * Depois das campanhas vem a tabela de pagamento (Google Ads, Meta Ads, quanto
 * e em que cartão), e ela também tem nome de veículo e valores — passa por
 * qualquer filtro ingênuo e entra na soma duas vezes.
 *
 * O corte limpo é a ETAPA 4S: toda campanha tem uma das quatro (Searching,
 * Scrolling, Shopping, Streaming) e nenhuma linha de pagamento tem. Com esse
 * filtro os cinco meses fecham exatamente com o total que a planilha declara.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DESTINO = join(RAIZ, 'src/features/colaborador/indicadores/dados/pdm.ts');

/**
 * As abas de mês, na ordem em que aparecem no texto.
 *
 * Só os meses que o Hub consegue avaliar: o realizado começa em abril/26.
 * As abas anteriores (out/25 a mar/26) existem na planilha e ficam de fora
 * porque não há realizado para comparar.
 */
const ABAS = [
  { aba: 'ABRIL26', mes: '2026-04' },
  { aba: 'MAIO26', mes: '2026-05' },
  { aba: 'JUNHO26', mes: '2026-06' },
  { aba: 'JULHO26', mes: '2026-07' },
  { aba: 'AGOSTO26', mes: '2026-08' },
];

/** As quatro etapas da metodologia 4S. Só elas marcam linha de campanha. */
const ETAPAS_4S = /^(Searching|Scrolling|Shopping|Streaming)$/i;

const EH_CABECALHO = /\|\s*TIPO\s*\|.*\|\s*ETAPA 4S\s*\|/;

const celulas = (linha) =>
  linha
    .split('|')
    .slice(1, -1)
    .map((c) => c.replace(/\\\[merged\\\]/g, '').replace(/\\-/g, '-').trim());

/** "R$ 1.234,56" e "16,5%" viram número; "-" e vazio viram null. */
function numero(texto) {
  if (!texto || texto === '-') return null;
  const limpo = String(texto).replace(/R\$|\s|\./g, '').replace(',', '.').replace('%', '');
  const n = parseFloat(limpo);
  return Number.isNaN(n) ? null : n;
}

/** Meta e Google são o que o PDM usa; o resto entra como veio. */
function plataforma(veiculo) {
  if (/meta/i.test(veiculo)) return 'meta';
  if (/google/i.test(veiculo)) return 'google';
  return 'outro';
}

function principal() {
  const origem = process.argv[2];
  if (!origem) throw new Error('informe o arquivo txt do PDM');

  const linhas = readFileSync(origem, 'utf8').split('\n');

  // Onde cada tabela de mês começa, na ordem do arquivo.
  const cabecalhos = [];
  linhas.forEach((l, i) => {
    if (EH_CABECALHO.test(l)) cabecalhos.push(i);
  });

  // As abas que interessam são as ÚLTIMAS da sequência de meses: as anteriores
  // são os meses de 2025 e as cópias antigas que a planilha guarda no fim.
  // A âncora é a aba de agosto, a mais recente, achada pelo rótulo da verba.
  const indiceDeAgosto = cabecalhos.findIndex((i) =>
    celulas(linhas[i]).some((c) => /^AGOSTO$/i.test(c)),
  );
  if (indiceDeAgosto < 0) throw new Error('não achei a aba de agosto');

  const primeira = indiceDeAgosto - (ABAS.length - 1);
  if (primeira < 0) throw new Error('faltam abas antes de agosto');

  const meses = [];

  ABAS.forEach(({ aba, mes }, ordem) => {
    const inicio = cabecalhos[primeira + ordem];
    const fim = cabecalhos[primeira + ordem + 1] ?? linhas.length;

    const cabecalho = celulas(linhas[inicio]);
    const coluna = (nome) => cabecalho.indexOf(nome);
    const valor = (c, nome) => {
      const j = coluna(nome);
      return j >= 0 ? c[j] : '';
    };

    // A linha logo abaixo do cabeçalho é o total que a Rise declara.
    const total = celulas(linhas[inicio + 1]);

    const campanhas = [];
    let bloco = 'performance';

    for (let k = inicio + 2; k < fim; k += 1) {
      const c = celulas(linhas[k]);
      if (c.length === 0) continue;

      const nomeDaCampanha = valor(c, 'CAMPANHA');
      // Linha que só nomeia um bloco: muda o bloco e segue.
      if (!valor(c, 'VEÍCULO') && /^(PERFORMANCE|OPERACIONAL|AWARENESS|BRANDING)$/i.test(nomeDaCampanha)) {
        bloco = /operacional/i.test(nomeDaCampanha) ? 'operacional' : 'performance';
        continue;
      }

      if (!ETAPAS_4S.test(valor(c, 'ETAPA 4S'))) continue;

      const veiculo = valor(c, 'VEÍCULO');
      campanhas.push({
        bloco,
        veiculo,
        plataforma: plataforma(veiculo),
        campanha: nomeDaCampanha,
        etapa: valor(c, 'ETAPA 4S'),
        kpi: valor(c, 'OBJETIVO (KPI)'),
        localidade: valor(c, 'LOCALIDADE'),
        liquido: numero(valor(c, 'LÍQUIDO')) ?? 0,
        bruto: numero(valor(c, 'BRUTO')) ?? 0,
        impressoes: numero(valor(c, 'IMPRESSÕES')),
        cliques: numero(valor(c, 'CLIQUES NO LINK')),
        cpa: numero(valor(c, 'CPA')),
        agendamentos: numero(valor(c, 'AGENDAMENTOS')),
        cpl: numero(valor(c, 'CPL')),
        leads: numero(valor(c, 'LEADS')),
      });
    }

    meses.push({
      mes,
      aba,
      campanhas,
      declarados: {
        liquido: numero(valor(total, 'LÍQUIDO')),
        bruto: numero(valor(total, 'BRUTO')),
        impressoes: numero(valor(total, 'IMPRESSÕES')),
        cliques: numero(valor(total, 'CLIQUES NO LINK')),
        agendamentos: numero(valor(total, 'AGENDAMENTOS')),
        leads: numero(valor(total, 'LEADS')),
      },
    });
  });

  // Conferência dura: se um mês não fecha, é erro de leitura, e gravar um
  // arquivo silenciosamente menor é o pior desfecho possível.
  for (const m of meses) {
    const soma = m.campanhas.reduce((a, c) => a + c.liquido, 0);
    if (Math.round(soma) !== Math.round(m.declarados.liquido)) {
      throw new Error(
        `${m.aba}: as campanhas somam ${soma} e a planilha declara ${m.declarados.liquido}`,
      );
    }
  }

  const aspas = (t) => JSON.stringify(t ?? null);
  const campo = (c) => `    {
      bloco: '${c.bloco}',
      veiculo: ${aspas(c.veiculo)},
      plataforma: '${c.plataforma}',
      campanha: ${aspas(c.campanha)},
      etapa: ${aspas(c.etapa)},
      kpi: ${aspas(c.kpi)},
      localidade: ${aspas(c.localidade)},
      liquido: ${c.liquido},
      bruto: ${c.bruto},
      impressoes: ${c.impressoes},
      cliques: ${c.cliques},
      cpa: ${c.cpa},
      agendamentos: ${c.agendamentos},
      cpl: ${c.cpl},
      leads: ${c.leads},
    },`;

  const corpo = meses
    .map(
      (m) => `  {
    mes: '${m.mes}',
    aba: '${m.aba}',
    declarados: {
      liquido: ${m.declarados.liquido},
      bruto: ${m.declarados.bruto},
      impressoes: ${m.declarados.impressoes},
      cliques: ${m.declarados.cliques},
      agendamentos: ${m.declarados.agendamentos},
      leads: ${m.declarados.leads},
    },
    campanhas: [
${m.campanhas.map(campo).join('\n')}
    ],
  },`,
    )
    .join('\n');

  const conteudo = `/**
 * O PDM — o plano de mídia que a Rise entrega todo mês.
 *
 * GERADO por \`scripts/gera-pdm.mjs\`. NÃO editar à mão: quando chegar um PDM
 * novo, exporte a planilha e rode o script de novo.
 *
 * Fonte: \`RISE_PURE-PILATES_PDM_BRANDPERFORMANCE_Q425Q126_11319\`.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * BRUTO, LÍQUIDO E O QUE DÁ PARA COMPARAR
 * ────────────────────────────────────────────────────────────────────────────
 * O \`liquido\` é o que vira mídia dentro da plataforma; o \`bruto\` é líquido
 * mais a comissão da agência, e é o que sai do caixa. A comissão nunca chega
 * ao Meta, então o número que o Meta reporta como gasto compara com o
 * LÍQUIDO — usar o bruto faria toda campanha parecer 20% abaixo do plano.
 *
 * Cada mês fecha exatamente com o total que a planilha declara. O gerador
 * recusa gravar se não fechar.
 */

export type BlocoDoPdm = 'performance' | 'operacional';
export type PlataformaDoPdm = 'meta' | 'google' | 'outro';

export interface CampanhaPlanejada {
  bloco: BlocoDoPdm;
  veiculo: string;
  plataforma: PlataformaDoPdm;
  campanha: string;
  etapa: string;
  kpi: string;
  localidade: string;
  /** O que vira mídia na plataforma. */
  liquido: number;
  /** Líquido + comissão da agência: o que sai do caixa. */
  bruto: number;
  impressoes: number | null;
  cliques: number | null;
  cpa: number | null;
  agendamentos: number | null;
  cpl: number | null;
  leads: number | null;
}

export interface MesPlanejado {
  /** No formato 'AAAA-MM'. */
  mes: string;
  /** A aba de origem na planilha, para quem for conferir. */
  aba: string;
  /** Os totais como a própria planilha os declara. */
  declarados: {
    liquido: number;
    bruto: number;
    impressoes: number;
    cliques: number;
    agendamentos: number;
    leads: number;
  };
  campanhas: CampanhaPlanejada[];
}

export const PDM: MesPlanejado[] = [
${corpo}
];
`;

  writeFileSync(DESTINO, conteudo, 'utf8');
  const total = meses.reduce((a, m) => a + m.campanhas.length, 0);
  console.log(`✓ ${meses.length} meses, ${total} campanhas`);
  for (const m of meses) {
    console.log(`  ${m.aba.padEnd(9)} ${m.campanhas.length} campanhas · R$ ${m.declarados.liquido.toLocaleString('pt-BR')}`);
  }
}

principal();
