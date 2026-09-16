// Pedido de verba para campanha de recrutamento de novos professores.
//
// Funções puras, sem API do Deno: a Edge Function usa para validar e montar o
// que vai para o n8n, e a tela do Hub importa as mesmas regras para o
// formulário nunca aceitar algo que o servidor recusaria. Testado pelo vitest
// do projeto em src/features/geral/verba-professores/.
//
// O FLUXO É O DA MÍDIA ADICIONAL, DO PEDIDO À APROVAÇÃO (pedido do usuário em
// 16/09/2026): mesmos campos, mesmo e-mail pelo n8n, mesma aprovação. A única
// diferença é que os planos A/B/C viram VERBA LIVRE + QUANTIDADE DE PROFESSORES.

/** Verba em reais inteiros. Centavos não fazem sentido numa verba de mídia. */
export const VALOR_MINIMO = 1;
export const VALOR_MAXIMO = 1_000_000;

export const PROFESSORES_MINIMO = 1;
export const PROFESSORES_MAXIMO = 50;

const TAMANHO_MAXIMO_TEXTO = 200;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface PedidoDeVerba {
  nome_franqueado: string;
  nome_unidade: string;
  data_inauguracao: string;
  valor_verba: number;
  qtd_professores: number;
  email_unidade: string;
  email_franqueado: string | null;
}

export type ResultadoDaValidacao =
  | { ok: true; pedido: PedidoDeVerba; erro?: undefined }
  | { ok: false; erro: string; pedido?: undefined };

function texto(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

/** 'AAAA-MM-DD' que existe no calendário (recusa 2026-02-30). */
function dataValida(v: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const [ano, mes, dia] = v.split('-').map(Number);
  const d = new Date(Date.UTC(ano, mes - 1, dia));
  return d.getUTCFullYear() === ano && d.getUTCMonth() === mes - 1 && d.getUTCDate() === dia;
}

/** Valida o corpo recebido. Mensagens em português, prontas para a tela. */
export function validarPedido(corpo: unknown): ResultadoDaValidacao {
  const c = (corpo ?? {}) as Record<string, unknown>;

  const nome_franqueado = texto(c.nome_franqueado);
  const nome_unidade = texto(c.nome_unidade);
  const data_inauguracao = texto(c.data_inauguracao);
  const email_unidade = texto(c.email_unidade);
  const email_franqueado = texto(c.email_franqueado) || null;

  if (!nome_franqueado) return { ok: false, erro: 'Informe o nome do franqueado.' };
  if (!nome_unidade) return { ok: false, erro: 'Informe o nome da unidade.' };
  if (nome_franqueado.length > TAMANHO_MAXIMO_TEXTO || nome_unidade.length > TAMANHO_MAXIMO_TEXTO) {
    return { ok: false, erro: 'Nome muito longo.' };
  }
  if (!dataValida(data_inauguracao)) return { ok: false, erro: 'Informe a data de inauguração.' };

  const valor_verba = c.valor_verba;
  if (typeof valor_verba !== 'number' || !Number.isInteger(valor_verba)
      || valor_verba < VALOR_MINIMO || valor_verba > VALOR_MAXIMO) {
    return { ok: false, erro: `A verba precisa ser um valor inteiro em reais, de R$ ${VALOR_MINIMO} a ${formatarReais(VALOR_MAXIMO)}.` };
  }

  const qtd_professores = c.qtd_professores;
  if (typeof qtd_professores !== 'number' || !Number.isInteger(qtd_professores)
      || qtd_professores < PROFESSORES_MINIMO || qtd_professores > PROFESSORES_MAXIMO) {
    return { ok: false, erro: `A quantidade de professores precisa ser de ${PROFESSORES_MINIMO} a ${PROFESSORES_MAXIMO}.` };
  }

  if (!EMAIL.test(email_unidade)) return { ok: false, erro: 'E-mail da unidade inválido.' };
  if (email_franqueado && !EMAIL.test(email_franqueado)) {
    return { ok: false, erro: 'E-mail do franqueado inválido.' };
  }

  return {
    ok: true,
    pedido: { nome_franqueado, nome_unidade, data_inauguracao, valor_verba, qtd_professores, email_unidade, email_franqueado },
  };
}

/** 3500 → "R$ 3.500,00". Sem Intl: o ICU do Deno e o do navegador divergem em espaço. */
export function formatarReais(valor: number): string {
  const inteiro = Math.trunc(valor).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `R$ ${inteiro},00`;
}

/** O que a pessoa digitou no campo de valor → reais inteiros (ou null se vazio). */
export function lerReais(digitado: string): number | null {
  const digitos = digitado.replace(/\D/g, '');
  return digitos ? Number(digitos) : null;
}

export function rotuloDeProfessores(n: number): string {
  return `${n} ${n === 1 ? 'professor' : 'professores'}`;
}

/** '2026-10-05' → '05/10/2026', sem depender de fuso nem de ICU. */
export function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

/**
 * Corpo enviado ao webhook do n8n. Mesmos campos que a send-midia-adicional
 * manda, para o workflow ser uma CÓPIA do da Mídia Adicional:
 * `plano` e `plano_label` continuam existindo, com o texto da verba, e o
 * e-mail duplicado já sai certo trocando só o caminho do webhook. Os campos
 * próprios (valor_verba, qtd_professores) vão junto para quem quiser usar.
 */
export function corpoDoWebhook(id: string, pedido: PedidoDeVerba, enviadoPor: string | null) {
  const planoLabel =
    `${formatarReais(pedido.valor_verba)} — campanha de recrutamento de ${rotuloDeProfessores(pedido.qtd_professores)}`;

  return {
    id,
    tipo: 'verba_professores',
    nome_franqueado: pedido.nome_franqueado,
    nome_unidade: pedido.nome_unidade,
    data_inauguracao: pedido.data_inauguracao,
    data_inauguracao_fmt: formatarData(pedido.data_inauguracao),
    plano: 'verba_professores',
    plano_label: planoLabel,
    valor_verba: pedido.valor_verba,
    valor_verba_fmt: formatarReais(pedido.valor_verba),
    qtd_professores: pedido.qtd_professores,
    email_unidade: pedido.email_unidade,
    email_franqueado: pedido.email_franqueado,
    submitted_by: enviadoPor,
  };
}
