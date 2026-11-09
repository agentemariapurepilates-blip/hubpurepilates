import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { EQUIPE_MARKETING } from '../equipe';

// Projetos do marketing no modelo do ClickUp (pedido de 09/11/2026). Projeto e
// subtarefa são o mesmo ITEM (tabela marketing_itens), um dentro do outro: o
// projeto abre só com o título e, numa página grande, ganha descrição com
// arquivos, início e vencimento, vários responsáveis, prioridade, etiquetas, os
// prazos das etapas, subtarefas (com as próprias subtarefas), checklist, links,
// comentários e o histórico de alterações. Migração 20261109160000.
//
// Sem frente de trabalho: um projeto envolve o marketing todo (pedido da equipe).

// As tabelas ainda não estão no types.ts gerado (regenerar depois da migração).
export const db = supabase as unknown as SupabaseClient;
export const BUCKET_ANEXOS = 'marketing-anexos';

/**
 * Nome único para um canal de tempo real. O Supabase devolve o MESMO canal quando o
 * nome se repete; o React monta a tela duas vezes em desenvolvimento e, com nome
 * fixo, a segunda montagem pegava o canal já assinado e quebrava a página
 * ("destroy is not a function", 09/11/2026).
 */
export const nomeDeCanal = (base: string) => `${base}-${Math.random().toString(36).slice(2, 10)}`;

export type ChaveEtapa = 'pre_planejamento' | 'planejamento' | 'producao' | 'no_ar';

/** As etapas na ordem, com a coluna de prazo e a cor de cada uma. */
export const ETAPAS: { chave: ChaveEtapa; nome: string; campo: keyof PrazosEtapas; cor: string }[] = [
  { chave: 'pre_planejamento', nome: 'Pré-planejamento', campo: 'prazo_pre_planejamento', cor: '#94a3b8' },
  { chave: 'planejamento', nome: 'Planejamento', campo: 'prazo_planejamento', cor: '#6366f1' },
  { chave: 'producao', nome: 'Produção', campo: 'prazo_producao', cor: '#f59e0b' },
  { chave: 'no_ar', nome: 'No ar', campo: 'prazo_no_ar', cor: '#10b981' },
];

export type StatusItem = 'a_fazer' | 'em_andamento' | 'em_revisao' | 'em_aprovacao' | 'concluida';

export const STATUS: { chave: StatusItem; nome: string; cor: string }[] = [
  { chave: 'a_fazer', nome: 'A fazer', cor: '#f97316' },
  { chave: 'em_andamento', nome: 'Em andamento', cor: '#3b82f6' },
  { chave: 'em_revisao', nome: 'Em revisão', cor: '#a855f7' },
  { chave: 'em_aprovacao', nome: 'Em aprovação', cor: '#b08968' },
  { chave: 'concluida', nome: 'Concluída', cor: '#10b981' },
];
export const statusDe = (s: StatusItem) => STATUS.find((x) => x.chave === s) ?? STATUS[0];

export type Prioridade = 'urgente' | 'alta' | 'normal' | 'baixa';

export const PRIORIDADES: { chave: Prioridade; nome: string; cor: string }[] = [
  { chave: 'urgente', nome: 'Urgente', cor: '#dc2626' },
  { chave: 'alta', nome: 'Alta', cor: '#f59e0b' },
  { chave: 'normal', nome: 'Normal', cor: '#3b82f6' },
  { chave: 'baixa', nome: 'Baixa', cor: '#94a3b8' },
];

export interface PrazosEtapas {
  prazo_pre_planejamento: string | null;
  prazo_planejamento: string | null;
  prazo_producao: string | null;
  prazo_no_ar: string | null;
}

export interface LinkItem {
  nome: string;
  url: string;
}

export interface Item extends PrazosEtapas {
  id: string;
  item_pai_id: string | null;
  projeto_id: string | null;
  titulo: string;
  descricao: string | null;
  status: StatusItem;
  prioridade: Prioridade | null;
  responsaveis: string[];
  data_inicio: string | null;
  prazo: string | null;
  estimativa_horas: number | null;
  etiquetas: string[];
  links: LinkItem[];
  aguardando: string[];
  ordem: number;
  concluida_em: string | null;
  arquivado: boolean;
  criado_por: string | null;
  created_at: string;
}

export interface Anexo {
  id: string;
  item_id: string;
  nome: string;
  caminho: string;
  tipo: string | null;
  tamanho: number | null;
  enviado_por: string | null;
  created_at: string;
}

export interface ItemChecklist {
  id: string;
  item_id: string;
  texto: string;
  feito: boolean;
  ordem: number;
}

export interface Comentario {
  id: string;
  item_id: string;
  autor_id: string | null;
  texto: string;
  created_at: string;
}

export interface Atividade {
  id: string;
  item_id: string;
  autor_id: string | null;
  campo: string;
  de: string | null;
  para: string | null;
  created_at: string;
}

export interface PessoaMarketing {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
}

// ---------- datas ----------

/** "2026-11-09" no fuso de Brasília, para comparar com as datas. */
export const hojeEmBrasilia = (agora = new Date()) =>
  new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(agora);

/** Dias entre duas datas "AAAA-MM-DD" (b - a). */
export const diasEntre = (a: string, b: string) =>
  Math.round((Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10)) - Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10))) / 86_400_000);

/** Soma dias a uma data "AAAA-MM-DD". */
export const somarDias = (d: string, n: number) =>
  new Date(Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10) + n)).toISOString().slice(0, 10);

/** "2026-11-09" vira "09/11". */
export const dataCurta = (d: string | null) => (d ? `${d.slice(8, 10)}/${d.slice(5, 7)}` : '—');

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
/** "2026-11-09" vira "9 nov". */
export const dataMedia = (d: string | null) => (d ? `${+d.slice(8, 10)} ${MESES[+d.slice(5, 7) - 1]}` : '—');
/** "2026-11-09" vira "9 nov 2026". */
export const dataLonga = (d: string | null) => (d ? `${dataMedia(d)} ${d.slice(0, 4)}` : '—');

// ---------- etapas, prazos, progresso ----------

/** A etapa em que o projeto está: a primeira cujo prazo ainda não passou. */
export function etapaAtual(p: PrazosEtapas, hoje = hojeEmBrasilia()): ChaveEtapa | null {
  const comPrazo = ETAPAS.filter((e) => p[e.campo]);
  if (comPrazo.length === 0) return null;
  return (comPrazo.find((e) => (p[e.campo] as string) >= hoje) ?? comPrazo[comPrazo.length - 1]).chave;
}

/**
 * As faixas das etapas na linha do tempo: cada etapa vai do dia seguinte ao prazo
 * da anterior (ou do início do projeto) até o próprio prazo. Etapa sem prazo some.
 */
export function faixasDasEtapas(p: PrazosEtapas & { data_inicio: string | null }) {
  const faixas: { de: string; ate: string; cor: string; nome: string }[] = [];
  let inicio = p.data_inicio;
  for (const e of ETAPAS) {
    const ate = p[e.campo];
    if (!ate) continue;
    faixas.push({ de: inicio && inicio <= ate ? inicio : ate, ate, cor: e.cor, nome: e.nome });
    inicio = somarDias(ate, 1);
  }
  return faixas;
}

export type SinalPrazo = 'atrasado' | 'perto' | 'ok';

/** Atrasado se o prazo passou; perto se vence em até 2 dias; senão, no prazo. */
export function sinalDoPrazo(prazo: string | null, concluido: boolean, hoje = hojeEmBrasilia()): SinalPrazo | null {
  if (!prazo || concluido) return null;
  if (prazo < hoje) return 'atrasado';
  return diasEntre(hoje, prazo) <= 2 ? 'perto' : 'ok';
}

export const COR_DO_SINAL: Record<SinalPrazo, string> = {
  atrasado: 'text-red-600',
  perto: 'text-amber-600',
  ok: 'text-foreground',
};

/** Itens concluídos sobre o total. */
export function progresso(itens: Pick<Item, 'status'>[]) {
  const total = itens.length;
  const feitas = itens.filter((t) => t.status === 'concluida').length;
  return { feitas, total, pct: total ? Math.round((feitas / total) * 100) : 0 };
}

/** O item está bloqueado se algum de quem ele depende ainda não foi concluído. */
export const bloqueadoPor = (t: Pick<Item, 'aguardando'>, todos: Pick<Item, 'id' | 'status' | 'titulo'>[]) =>
  todos.filter((x) => t.aguardando.includes(x.id) && x.status !== 'concluida');

/** Todos os descendentes de um item (subtarefas, sub-subtarefas...). */
export function descendentes(id: string, todos: Pick<Item, 'id' | 'item_pai_id'>[]): string[] {
  const filhos = todos.filter((t) => t.item_pai_id === id).map((t) => t.id);
  return filhos.flatMap((f) => [f, ...descendentes(f, todos)]);
}

// ---------- anexos ----------

export type TipoArquivo = 'imagem' | 'video' | 'pdf' | 'documento' | 'planilha' | 'apresentacao' | 'outro';

export function tipoDoArquivo(nome: string, mime: string | null): TipoArquivo {
  const ext = nome.split('.').pop()?.toLowerCase() ?? '';
  if (mime?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'svg'].includes(ext)) return 'imagem';
  if (mime?.startsWith('video/') || ['mp4', 'mov', 'webm', 'm4v'].includes(ext)) return 'video';
  if (ext === 'pdf' || mime === 'application/pdf') return 'pdf';
  if (['doc', 'docx', 'odt', 'rtf', 'txt'].includes(ext)) return 'documento';
  if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) return 'planilha';
  if (['ppt', 'pptx', 'key', 'odp'].includes(ext)) return 'apresentacao';
  return 'outro';
}

export const tamanhoLegivel = (b: number | null) =>
  b == null ? '' : b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;

/** Nome seguro para o caminho no Storage (sem acento nem espaço). */
export const nomeSeguro = (nome: string) =>
  nome.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').slice(-120);

// ---------- equipe ----------

/** As pessoas do time de marketing (para escolher responsáveis). */
export async function buscarEquipe(): Promise<PessoaMarketing[]> {
  const { data } = await db
    .from('profiles')
    .select('user_id, full_name, avatar_url, email')
    .in('email', EQUIPE_MARKETING as string[]);
  return ((data ?? []) as (PessoaMarketing & { email: string })[])
    .map(({ user_id, full_name, avatar_url }) => ({ user_id, full_name, avatar_url }))
    .sort((a, b) => (a.full_name ?? '').localeCompare(b.full_name ?? '', 'pt-BR'));
}

export const primeiroNome = (p: PessoaMarketing | undefined) => (p?.full_name ?? '').split(' ')[0] || 'Alguém';
