// O pedido de Campanha Aporte como as duas telas o enxergam: a do franqueado
// (Minhas Solicitações) e a de quem analisa (Visão Geral das Unidades).
//
// Tipos, rótulos e formatação ficam aqui porque as duas telas mostram o MESMO
// cartão. Antes cada arquivo tinha a sua cópia, e elas já divergiram na
// prática — o selo de recusada teria que ser escrito duas vezes.

export type PlanKey = '1500_3m' | '2000_3m' | '2500';
export type StatusKey = 'pendente' | 'aprovada' | 'recusada';

export interface MidiaRequest {
  id: string;
  nome_franqueado: string;
  nome_unidade: string;
  data_inauguracao: string;
  plano: PlanKey;
  email_unidade: string;
  email_franqueado: string | null;
  status: StatusKey;
  motivo_recusa: string | null;
  created_at: string;
}

/** Colunas lidas do banco, na ordem em que aparecem no cartão. */
export const COLUNAS_DO_PEDIDO =
  'id, nome_franqueado, nome_unidade, data_inauguracao, plano, email_unidade, email_franqueado, status, motivo_recusa, created_at';

export const PLAN_LABEL: Record<PlanKey, string> = {
  '1500_3m': 'Plano A · R$ 1.500,00',
  '2000_3m': 'Plano B · R$ 2.000,00',
  '2500': 'Plano C · R$ 2.500,00',
};

/** As três opções como aparecem no formulário de edição. */
export const PLANOS: Array<{ key: PlanKey; titulo: string; valor: string; descricao: string }> = [
  { key: '1500_3m', titulo: 'Plano A', valor: 'R$ 1.500,00', descricao: '3 meses de campanha de aula experimental.' },
  { key: '2000_3m', titulo: 'Plano B', valor: 'R$ 2.000,00', descricao: '3 meses de campanha de aula experimental.' },
  { key: '2500', titulo: 'Plano C', valor: 'R$ 2.500,00', descricao: 'Campanha de aula experimental.' },
];

export const STATUS_META: Record<StatusKey, { label: string; className: string }> = {
  pendente: { label: 'Pendente', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  aprovada: { label: 'Verba adicional aprovada', className: 'bg-green-100 text-green-800 border-green-200' },
  recusada: { label: 'Recusada', className: 'bg-red-100 text-red-800 border-red-200' },
};

export const formatarData = (dataIso: string) =>
  new Date(dataIso + 'T00:00:00').toLocaleDateString('pt-BR');

export const formatarDataHora = (timestamp: string) =>
  new Date(timestamp).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
