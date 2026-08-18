/**
 * A planilha de leads de RH.
 *
 * Uma aba com todos os leads e, depois, UMA ABA POR CONJUNTO DE ANÚNCIO — que
 * é a separação pedida: cada conjunto tem uma unidade no nome, e quem cuida do
 * RH daquela unidade abre a aba dela e trabalha só aquela lista.
 *
 * Usa o `xlsx` que o Hub já tem, e não CSV: CSV não tem abas, e sem abas a
 * separação por conjunto viraria uma coluna a mais para a pessoa filtrar na mão
 * toda vez.
 */

import * as XLSX from 'xlsx';
import { agruparPorConjunto, type LeadRH } from './leads';

/** Colunas fixas, na ordem em que o RH lê: quem é, como falar, de onde veio. */
const COLUNAS_FIXAS = [
  'Data',
  'Hora',
  'Nome',
  'E-mail',
  'Telefone',
  'Unidade escolhida',
  'Unidade do conjunto',
  'Conjunto de anúncio',
  'Campanha',
  'Anúncio',
  'Formulário',
  'Plataforma',
  'Origem',
  'ID do lead',
] as const;

/**
 * Caracteres que o Excel proíbe em nome de aba, mais o limite de 31.
 *
 * Não é preciosismo: `sao-bernardo-do-campo/nova-petropolis | sao-paulo |
 * cargos | instrutor-pilates` tem 76 caracteres e uma barra. Sem tratar, o
 * arquivo abre corrompido — e o erro do Excel não diz o motivo.
 */
const PROIBIDOS = /[\\/?*[\]:]/g;
const LIMITE_DA_ABA = 31;

export function nomeDeAba(bruto: string, jaUsados: Set<string>): string {
  const limpo = bruto.replace(PROIBIDOS, '-').trim() || 'Sem nome';
  let nome = limpo.slice(0, LIMITE_DA_ABA);

  // Truncar cria colisão: duas unidades longas viram o mesmo nome, e o Excel
  // recusa abas repetidas. O sufixo numérico resolve mantendo a leitura.
  if (jaUsados.has(nome)) {
    for (let i = 2; ; i++) {
      const sufixo = ` (${i})`;
      const tentativa = limpo.slice(0, LIMITE_DA_ABA - sufixo.length) + sufixo;
      if (!jaUsados.has(tentativa)) {
        nome = tentativa;
        break;
      }
    }
  }

  jaUsados.add(nome);
  return nome;
}

/** `2026-08-11T19:50:20+0000` → `11/08/2026`. Sem `new Date`, que desloca o fuso. */
export function dataBr(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split('-');
  return dia && mes && ano ? `${dia}/${mes}/${ano}` : iso;
}

/** `2026-08-11T19:50:20+0000` → `19:50`. */
export function horaBr(iso: string): string {
  return iso.slice(11, 16);
}

/**
 * As perguntas livres que aparecem em algum lead da lista.
 *
 * Cada formulário tem as suas, e um formulário novo pode acrescentar uma
 * pergunta a qualquer momento. Fixar as colunas no código faria a resposta nova
 * sumir da planilha sem ninguém perceber.
 */
export function perguntasDe(leads: LeadRH[]): string[] {
  const vistas: string[] = [];
  for (const lead of leads) {
    for (const resposta of lead.respostas) {
      if (!vistas.includes(resposta.pergunta)) vistas.push(resposta.pergunta);
    }
  }
  return vistas;
}

export function linhaDoLead(lead: LeadRH, perguntas: string[]): Record<string, string> {
  const linha: Record<string, string> = {
    Data: dataBr(lead.criadoEm),
    Hora: horaBr(lead.criadoEm),
    Nome: lead.nome ?? '',
    'E-mail': lead.email ?? '',
    Telefone: lead.telefone ?? '',
    'Unidade escolhida': lead.unidadeEscolhida ?? '',
    'Unidade do conjunto': lead.unidadeDoConjunto ?? '',
    'Conjunto de anúncio': lead.conjuntoNome ?? '',
    Campanha: lead.campanha ?? '',
    Anúncio: lead.anuncio ?? '',
    Formulário: lead.formulario ?? '',
    Plataforma: lead.plataforma ?? '',
    Origem: lead.organico ? 'orgânico' : 'anúncio',
    'ID do lead': lead.id,
  };

  for (const pergunta of perguntas) {
    linha[pergunta] = lead.respostas.find((r) => r.pergunta === pergunta)?.resposta ?? '';
  }

  return linha;
}

/** Largura de coluna legível: sem isto tudo sai com 8 caracteres. */
function larguras(colunas: readonly string[]) {
  return colunas.map((coluna) => ({ wch: Math.min(42, Math.max(coluna.length + 2, 12)) }));
}

function folhaDe(linhas: Array<Record<string, unknown>>, colunas: readonly string[]) {
  const folha = XLSX.utils.json_to_sheet(linhas, { header: colunas as string[] });
  folha['!cols'] = larguras(colunas);
  return folha;
}

/**
 * A planilha: uma aba com todos os candidatos e UMA ABA POR CONJUNTO.
 *
 * Quem cuida do RH de uma unidade abre a aba dela e trabalha só aquela lista.
 */
export function montarPlanilha(leads: LeadRH[]): XLSX.WorkBook {
  const livro = XLSX.utils.book_new();
  const usados = new Set<string>();

  const perguntas = perguntasDe(leads);
  const colunas = [...COLUNAS_FIXAS, ...perguntas];
  const aba = (lista: LeadRH[]) =>
    folhaDe(lista.map((lead) => linhaDoLead(lead, perguntas)), colunas);

  XLSX.utils.book_append_sheet(livro, aba(leads), nomeDeAba('Todos os leads', usados));

  for (const grupo of agruparPorConjunto(leads)) {
    // A aba leva o nome da UNIDADE, e não o do conjunto: o conjunto inteiro
    // não cabe em 31 caracteres e todos começam igual, então as abas ficariam
    // indistinguíveis justamente no pedaço visível.
    const rotulo = grupo.unidade ?? grupo.conjuntoNome;
    XLSX.utils.book_append_sheet(livro, aba(grupo.leads), nomeDeAba(rotulo, usados));
  }

  return livro;
}

/**
 * A planilha de UM conjunto só: uma aba, sem a de "todos".
 *
 * Com um conjunto apenas, "Todos os leads" e a aba da unidade teriam exatamente
 * as mesmas linhas — duas abas iguais fazem quem abre procurar a diferença que
 * não existe.
 */
export function montarPlanilhaDoConjunto(leads: LeadRH[], rotulo: string): XLSX.WorkBook {
  const livro = XLSX.utils.book_new();
  const perguntas = perguntasDe(leads);
  const colunas = [...COLUNAS_FIXAS, ...perguntas];

  XLSX.utils.book_append_sheet(
    livro,
    folhaDe(leads.map((lead) => linhaDoLead(lead, perguntas)), colunas),
    nomeDeAba(rotulo, new Set()),
  );

  return livro;
}

/**
 * Nome de arquivo seguro no Windows, no macOS e no Linux.
 *
 * A unidade vem do nome do conjunto e traz barra — `jacarei/boulevard`. Numa
 * barra o navegador trataria o pedaço antes dela como pasta, e o download
 * sairia com nome truncado ou falharia sem dizer por quê.
 */
export function nomeDeArquivo(rotulo: string): string {
  return rotulo
    .replace(/[\\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/** Monta e baixa tudo. O nome do arquivo carrega a data, para não sobrescrever. */
export function baixarPlanilha(leads: LeadRH[], hoje: string) {
  XLSX.writeFile(montarPlanilha(leads), `leads-rh_${hoje}.xlsx`);
}

/** Monta e baixa um conjunto só. */
export function baixarConjunto(leads: LeadRH[], rotulo: string, hoje: string) {
  XLSX.writeFile(
    montarPlanilhaDoConjunto(leads, rotulo),
    `leads-rh_${nomeDeArquivo(rotulo)}_${hoje}.xlsx`,
  );
}
