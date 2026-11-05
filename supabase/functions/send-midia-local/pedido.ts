// Pedido de MÍDIA LOCAL na TV Globo.
//
// O franqueado pede, pelo Hub, um plano de mídia para a praça dele. O pedido
// fica gravado e vai por e-mail para a Rise, que negocia com a Globo e responde
// DIRETO ao franqueado (por isso o e-mail e o telefone dele vão no pedido, e o
// e-mail dele é o "responder para").
//
// Funções puras, sem API do Deno: a Edge Function valida e monta o corpo do
// webhook com elas, e a tela do Hub importa as MESMAS regras, para o formulário
// nunca aceitar algo que o servidor recusaria. Testado pelo vitest em
// src/features/geral/midia-local/.
//
// Mesmo molde do pedido de Verba para professores (send-verba-professores).

export const OBJETIVOS = {
  inauguracao: 'Inauguração prevista (loja nova)',
  reforco: 'Reforço de marketing local',
} as const;

export const CRIATIVOS = {
  cartela: 'Cartela com texto e foto (modelo DCO, sem custo de Ancine)',
  adaptacao: 'Adaptação de comercial de campanha temática (tem custo de Ancine, calculado à parte)',
} as const;

/** Na ordem em que aparecem no formulário e no e-mail. */
export const PRODUTOS = {
  tv: 'Só TV Globo',
  tv_digital: 'TV mais digital',
  near_live: 'Near Live (comercial gravado com talento local)',
  tv_gama: 'TV Globo com as telas da GAMA',
} as const;

export type Objetivo = keyof typeof OBJETIVOS;
export type CriativoTipo = keyof typeof CRIATIVOS;
export type Produto = keyof typeof PRODUTOS;

const TEXTO_CURTO = 200;
const TEXTO_ENDERECO = 300;
const TEXTO_LONGO = 1000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface PedidoMidiaLocal {
  nome_franqueado: string;
  email_franqueado: string;
  /** Só dígitos, com DDD e sem o 55. Use `formatarTelefone` para mostrar. */
  telefone: string;
  nome_unidade: string;
  endereco_unidade: string;
  cep: string;
  objetivo: Objetivo;
  /** Só existe quando o objetivo é inauguração. */
  data_inauguracao: string | null;
  periodo_inicio: string;
  periodo_fim: string;
  cnpj: string;
  razao_social: string;
  endereco_cobranca: string;
  criativo_tipo: CriativoTipo;
  criativo_info: string;
  produtos: Produto[];
}

export type ResultadoDaValidacao =
  | { ok: true; pedido: PedidoMidiaLocal; erro?: undefined }
  | { ok: false; erro: string; pedido?: undefined };

// ── campos com regra ────────────────────────────────────────────────────────

/** 'AAAA-MM-DD' que existe no calendário (recusa 2026-02-30). */
function dataValida(v: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const [ano, mes, dia] = v.split('-').map(Number);
  const d = new Date(Date.UTC(ano, mes - 1, dia));
  return d.getUTCFullYear() === ano && d.getUTCMonth() === mes - 1 && d.getUTCDate() === dia;
}

/** '2026-12-01' → '01/12/2026', sem depender de fuso nem de ICU. */
export function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

export function formatarCep(digitos: string): string {
  return `${digitos.slice(0, 5)}-${digitos.slice(5)}`;
}

export function formatarCnpj(base: string): string {
  return `${base.slice(0, 2)}.${base.slice(2, 5)}.${base.slice(5, 8)}/${base.slice(8, 12)}-${base.slice(12)}`;
}

/** '11999991234' → '(11) 99999-1234'; fixo de 10 dígitos → '(11) 3333-4444'. */
export function formatarTelefone(digitos: string): string {
  const ddd = digitos.slice(0, 2);
  const numero = digitos.slice(2);
  const corte = numero.length === 9 ? 5 : 4;
  return `(${ddd}) ${numero.slice(0, corte)}-${numero.slice(corte)}`;
}

/**
 * Dígito verificador do CNPJ. Cada caractere vale (código ASCII − 48): para os
 * números nada muda, e as letras do CNPJ ALFANUMÉRICO (emitido pela Receita a
 * partir de julho/2026) entram na mesma conta. Uma loja nova pode já nascer com
 * um destes, e um validador só numérico recusaria um franqueado legítimo.
 */
function digitoDoCnpj(base: string): number {
  const pesos = base.length === 12
    ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const soma = [...base].reduce((total, c, i) => total + (c.charCodeAt(0) - 48) * pesos[i], 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

/** CNPJ formatado, ou `null` se não for um CNPJ válido (numérico ou alfanumérico). */
export function validarCnpj(texto: string): string | null {
  const limpo = texto.toUpperCase().replace(/[.\-/\s]/g, '');
  if (!/^[A-Z0-9]{12}\d{2}$/.test(limpo)) return null;
  if (/^(\d)\1{13}$/.test(limpo)) return null;

  const base = limpo.slice(0, 12);
  const d1 = digitoDoCnpj(base);
  const d2 = digitoDoCnpj(base + d1);
  return limpo.endsWith(`${d1}${d2}`) ? formatarCnpj(limpo) : null;
}

/** Telefone com DDD → só dígitos (sem o 55), ou `null` se não parecer um. */
function normalizarTelefone(texto: string): string | null {
  let digitos = texto.replace(/\D/g, '');
  if (digitos.length >= 12 && digitos.startsWith('55')) digitos = digitos.slice(2);
  if (digitos.length !== 10 && digitos.length !== 11) return null;
  if (digitos[0] === '0' || digitos[1] === '0') return null; // DDD
  if (digitos.length === 11 && digitos[2] !== '9') return null; // celular começa em 9
  return digitos;
}

function texto(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

// ── validação do pedido inteiro ─────────────────────────────────────────────

/** Valida o corpo recebido. Mensagens em português, prontas para a tela. */
export function validarPedido(corpo: unknown): ResultadoDaValidacao {
  const c = (corpo ?? {}) as Record<string, unknown>;
  const erro = (mensagem: string): ResultadoDaValidacao => ({ ok: false, erro: mensagem });

  const nome_franqueado = texto(c.nome_franqueado);
  const nome_unidade = texto(c.nome_unidade);
  const endereco_unidade = texto(c.endereco_unidade);
  const razao_social = texto(c.razao_social);
  const endereco_cobranca = texto(c.endereco_cobranca);
  const criativo_info = texto(c.criativo_info);
  const email_franqueado = texto(c.email_franqueado);

  if (!nome_franqueado) return erro('Informe o nome do franqueado.');
  if (!EMAIL.test(email_franqueado)) return erro('E-mail do franqueado inválido.');
  const telefone = normalizarTelefone(texto(c.telefone));
  if (!telefone) return erro('Telefone inválido: informe com DDD, por exemplo (11) 99999-1234.');

  if (!nome_unidade) return erro('Informe o nome da unidade.');
  if (!endereco_unidade) return erro('Informe o endereço da unidade.');
  const cepDigitos = texto(c.cep).replace(/\D/g, '');
  if (!/^\d{8}$/.test(texto(c.cep).replace(/[\s.-]/g, ''))) return erro('CEP inválido: são 8 dígitos.');

  const objetivo = texto(c.objetivo) as Objetivo;
  if (!(objetivo in OBJETIVOS)) return erro('Escolha o objetivo da campanha.');
  let data_inauguracao: string | null = null;
  if (objetivo === 'inauguracao') {
    data_inauguracao = texto(c.data_inauguracao);
    if (!dataValida(data_inauguracao)) return erro('Informe a data prevista da inauguração.');
  }

  const periodo_inicio = texto(c.periodo_inicio);
  const periodo_fim = texto(c.periodo_fim);
  if (!dataValida(periodo_inicio)) return erro('Informe a data de início da veiculação.');
  if (!dataValida(periodo_fim)) return erro('Informe a data de fim da veiculação.');
  if (periodo_fim < periodo_inicio) return erro('O fim da veiculação não pode ser antes do início.');

  const cnpj = validarCnpj(texto(c.cnpj));
  if (!cnpj) return erro('CNPJ inválido: confira os números.');
  if (!razao_social) return erro('Informe a razão social.');
  if (!endereco_cobranca) return erro('Informe o endereço de cobrança.');

  const criativo_tipo = texto(c.criativo_tipo) as CriativoTipo;
  if (!(criativo_tipo in CRIATIVOS)) return erro('Escolha o tipo de criativo.');
  if (!criativo_info) return erro('Descreva as informações do criativo que precisam ser adequadas.');

  if (!Array.isArray(c.produtos)) return erro('Marque o que você quer contratar.');
  const marcados = new Set(c.produtos.map((p) => String(p)));
  if ([...marcados].some((p) => !(p in PRODUTOS))) return erro('Produto inválido na seleção.');
  const produtos = (Object.keys(PRODUTOS) as Produto[]).filter((p) => marcados.has(p));
  if (produtos.length === 0) return erro('Marque pelo menos uma opção do que quer contratar.');

  const longos: Array<[string, number]> = [
    [nome_franqueado, TEXTO_CURTO], [nome_unidade, TEXTO_CURTO], [razao_social, TEXTO_CURTO],
    [endereco_unidade, TEXTO_ENDERECO], [endereco_cobranca, TEXTO_ENDERECO], [criativo_info, TEXTO_LONGO],
  ];
  if (longos.some(([valor, limite]) => valor.length > limite)) return erro('Algum campo passou do tamanho permitido.');

  return {
    ok: true,
    pedido: {
      nome_franqueado, email_franqueado, telefone, nome_unidade, endereco_unidade,
      cep: formatarCep(cepDigitos),
      objetivo, data_inauguracao, periodo_inicio, periodo_fim,
      cnpj, razao_social, endereco_cobranca, criativo_tipo, criativo_info, produtos,
    },
  };
}

// ── e-mail ──────────────────────────────────────────────────────────────────

/** E-mails válidos, sem repetição (ignorando maiúsculas) e sem espaços. */
export function destinatariosDoEmail(linhas: Array<{ email: string | null }>): string[] {
  const vistos = new Set<string>();
  const saida: string[] = [];
  for (const { email } of linhas) {
    const limpo = (email ?? '').trim();
    if (!EMAIL.test(limpo) || vistos.has(limpo.toLowerCase())) continue;
    vistos.add(limpo.toLowerCase());
    saida.push(limpo);
  }
  return saida;
}

/**
 * Quem recebe cópia do e-mail. Só quando o criativo é ADAPTAÇÃO de comercial de
 * campanha: ela tem custo de Ancine, e o marketing da Pure precisa saber. O
 * endereço vem de uma variável de ambiente (MIDIA_LOCAL_CC_ANCINE, vários
 * separados por vírgula); sem ela, não há cópia e nada quebra.
 */
export function copiaParaAncine(pedido: PedidoMidiaLocal, configurado: string | undefined): string[] {
  if (pedido.criativo_tipo !== 'adaptacao') return [];
  return destinatariosDoEmail((configurado ?? '').split(',').map((email) => ({ email })));
}

/**
 * Corpo enviado ao webhook do n8n. Tudo já formatado: o workflow só imprime.
 * `responder_para` é o e-mail do franqueado — a Rise responde direto a ele.
 */
export function corpoDoWebhook(
  id: string,
  pedido: PedidoMidiaLocal,
  enviadoPor: string | null,
  destinatarios: string[],
  cc: string[],
) {
  return {
    id,
    tipo: 'midia_local',
    nome_franqueado: pedido.nome_franqueado,
    email_franqueado: pedido.email_franqueado,
    telefone_fmt: formatarTelefone(pedido.telefone),
    nome_unidade: pedido.nome_unidade,
    endereco_unidade: pedido.endereco_unidade,
    cep: pedido.cep,
    objetivo_label: OBJETIVOS[pedido.objetivo],
    data_inauguracao_fmt: pedido.data_inauguracao ? formatarData(pedido.data_inauguracao) : '',
    periodo_fmt: `${formatarData(pedido.periodo_inicio)} a ${formatarData(pedido.periodo_fim)}`,
    cnpj: pedido.cnpj,
    razao_social: pedido.razao_social,
    endereco_cobranca: pedido.endereco_cobranca,
    criativo_label: CRIATIVOS[pedido.criativo_tipo],
    ancine: pedido.criativo_tipo === 'adaptacao',
    criativo_info: pedido.criativo_info,
    produtos_texto: pedido.produtos.map((p) => PRODUTOS[p]).join(' · '),
    submitted_by: enviadoPor,
    responder_para: pedido.email_franqueado,
    destinatarios,
    cc,
  };
}
