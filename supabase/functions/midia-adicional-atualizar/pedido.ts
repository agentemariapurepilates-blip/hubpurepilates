// Edição de um pedido de Campanha Aporte (midia_adicional_requests) por
// colaborador ou admin, na Visão Geral das Unidades.
//
// Funções puras, sem API do Deno: a Edge Function valida com elas e a tela do
// Hub usa as MESMAS regras, para o formulário de edição nunca aceitar o que o
// servidor recusaria. Testadas pelo vitest em src/features/geral/midia-adicional/.
//
// POR QUE A EDIÇÃO PASSA POR UMA FUNCTION, e não por um update direto como a
// aprovação: ao editar, quem recebe o e-mail do pedido tem que receber um
// e-mail novo, com os dados corrigidos (pedido do usuário em 24/09/2026). O
// webhook do n8n não pode ser chamado do navegador, então a function grava e
// avisa no mesmo passo.

export const PLANOS: Record<string, string> = {
  '1500_3m': 'R$ 1.500,00 — campanha de aula experimental por 3 meses',
  '2000_3m': 'R$ 2.000,00 — campanha de aula experimental por 3 meses',
  '2500': 'R$ 2.500,00 — campanha de aula experimental',
};

const TAMANHO_MAXIMO_TEXTO = 200;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface PedidoEditado {
  id: string;
  nome_franqueado: string;
  nome_unidade: string;
  data_inauguracao: string;
  plano: string;
  email_unidade: string;
  email_franqueado: string | null;
}

export type ResultadoDaValidacao =
  | { ok: true; pedido: PedidoEditado; erro?: undefined }
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

/** Valida a edição inteira. Mensagens em português, prontas para a tela. */
export function validarEdicao(corpo: unknown): ResultadoDaValidacao {
  const c = (corpo ?? {}) as Record<string, unknown>;

  const id = texto(c.id);
  const nome_franqueado = texto(c.nome_franqueado);
  const nome_unidade = texto(c.nome_unidade);
  const data_inauguracao = texto(c.data_inauguracao);
  const plano = texto(c.plano);
  const email_unidade = texto(c.email_unidade);
  const email_franqueado = texto(c.email_franqueado) || null;

  if (!UUID.test(id)) return { ok: false, erro: 'Pedido inválido.' };
  if (!nome_franqueado) return { ok: false, erro: 'Informe o nome do franqueado.' };
  if (!nome_unidade) return { ok: false, erro: 'Informe o nome da unidade.' };
  if (nome_franqueado.length > TAMANHO_MAXIMO_TEXTO || nome_unidade.length > TAMANHO_MAXIMO_TEXTO) {
    return { ok: false, erro: 'Nome muito longo.' };
  }
  if (!dataValida(data_inauguracao)) return { ok: false, erro: 'Informe a data de inauguração.' };
  if (!PLANOS[plano]) return { ok: false, erro: 'Plano inválido.' };
  if (!EMAIL.test(email_unidade)) return { ok: false, erro: 'E-mail da unidade inválido.' };
  if (email_franqueado && !EMAIL.test(email_franqueado)) {
    return { ok: false, erro: 'E-mail do franqueado inválido.' };
  }

  return {
    ok: true,
    pedido: { id, nome_franqueado, nome_unidade, data_inauguracao, plano, email_unidade, email_franqueado },
  };
}

/** Só o que vai para o banco: o id identifica a linha, não é coluna a gravar. */
export function camposParaGravar(pedido: PedidoEditado): Omit<PedidoEditado, 'id'> {
  const { id: _id, ...campos } = pedido;
  return campos;
}

/** '2026-10-05' → '05/10/2026', sem depender de fuso nem de ICU. */
export function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

/**
 * Corpo do webhook do n8n. São os MESMOS campos que a send-midia-adicional
 * manda, porque o e-mail sai pelo mesmo workflow — mais `editado`, que o
 * workflow usa para escrever "EDITADA" no assunto e no título, e
 * `editado_por`, para o time saber quem mexeu.
 */
export function corpoDoWebhook(pedido: PedidoEditado, editadoPor: string | null) {
  return {
    id: pedido.id,
    editado: true,
    editado_por: editadoPor,
    nome_franqueado: pedido.nome_franqueado,
    nome_unidade: pedido.nome_unidade,
    data_inauguracao: pedido.data_inauguracao,
    data_inauguracao_fmt: formatarData(pedido.data_inauguracao),
    plano: pedido.plano,
    plano_label: PLANOS[pedido.plano],
    email_unidade: pedido.email_unidade,
    email_franqueado: pedido.email_franqueado,
    submitted_by: editadoPor,
  };
}
