// ============================================================================
// Repositorio de editorial_posts no Supabase.
// Toda I/O contra a tabela mora aqui — handlers do page consomem como funcoes
// puras (recebem supabase client + params, retornam Promise).
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  GeneratedContent, SceneEntry, FieldFeedback, RefinementEntry, VersaoEditada, PastPlan,
  NETWORKS_IG,
} from '../types';

// Default mantido por back-compat: agente IG usa esses canais.
// Cada caller pode passar um array proprio (ex: TikTok agent passa ['Tik Tok']).
const DEFAULT_NETWORKS = NETWORKS_IG;

// O cliente Supabase do projeto e tipado pelo schema, mas usamos `as any` aqui
// pois editorial_posts ainda nao foi adicionada aos tipos gerados.
// deno-lint-ignore no-explicit-any
type SB = SupabaseClient<any, any, any>;

// Shape bruto que vem do Supabase (todos os campos do select '*').
export interface PostRow {
  id: string;
  post_date: string;
  network: string;
  title: string;
  description: string;
  status: GeneratedContent['status'];
  content_type?: string | null;
  legenda?: string | null;
  roteiro?: string | null;
  cenas?: SceneEntry[] | null;
  texto_arte?: string | null;
  briefing_arte?: string | null;
  feedback_motivo?: string | null;
  field_feedback?: FieldFeedback | null;
  versao_editada?: VersaoEditada | null;
  refinements?: RefinementEntry[] | null;
}

// Mapeia uma row do banco para o shape consumido pela UI.
function rowToContent(row: PostRow): GeneratedContent {
  return {
    id: row.id,
    date: row.post_date,
    network: row.network as GeneratedContent['network'],
    title: row.title,
    description: row.description,
    status: row.status,
    content_type: (row.content_type as GeneratedContent['content_type']) ?? null,
    legenda: row.legenda ?? null,
    roteiro: row.roteiro ?? null,
    cenas: Array.isArray(row.cenas) ? row.cenas : null,
    texto_arte: row.texto_arte ?? null,
    briefing_arte: row.briefing_arte ?? null,
    feedback_motivo: row.feedback_motivo ?? null,
    field_feedback: row.field_feedback ?? null,
    versao_editada: row.versao_editada ?? null,
    refinements: row.refinements ?? null,
  };
}

export async function selectMonthPosts(
  supabase: SB, userId: string, month: string, year: string,
  networks: GeneratedContent['network'][] = DEFAULT_NETWORKS,
): Promise<GeneratedContent[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('editorial_posts' as never) as any)
    .select('*')
    .eq('user_id', userId)
    .eq('month', month)
    .eq('year', year)
    .in('network', networks)
    .order('post_date', { ascending: true });
  if (error) throw error;
  return ((data ?? []) as PostRow[]).map(rowToContent);
}

export async function selectPlanSummaries(
  supabase: SB, userId: string,
  networks: GeneratedContent['network'][] = DEFAULT_NETWORKS,
): Promise<PastPlan[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('editorial_posts' as never) as any)
    .select('month, year, status')
    .eq('user_id', userId)
    .in('network', networks);
  if (error) throw error;
  const rows = (data ?? []) as Array<{ month: string; year: string; status: string }>;
  const grouped = new Map<string, PastPlan>();
  rows.forEach((r) => {
    const key = `${r.year}-${r.month}`;
    const existing = grouped.get(key) ?? { month: r.month, year: r.year, total: 0, approved: 0 };
    existing.total += 1;
    if (r.status === 'approved') existing.approved += 1;
    grouped.set(key, existing);
  });
  return Array.from(grouped.values());
}

export async function replaceMonthPosts(
  supabase: SB, userId: string, month: string, year: string, posts: GeneratedContent[],
  networks: GeneratedContent['network'][] = DEFAULT_NETWORKS,
): Promise<GeneratedContent[]> {
  // Apaga existentes IG/FB do mes antes de inserir os novos.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('editorial_posts' as never) as any)
    .delete()
    .eq('user_id', userId)
    .eq('month', month)
    .eq('year', year)
    .in('network', networks);

  const rows = posts.map((p) => ({
    user_id: userId,
    month,
    year,
    post_date: p.date,
    network: p.network,
    title: p.title,
    description: p.description,
    status: p.status,
    content_type: p.content_type ?? null,
    legenda: p.legenda ?? null,
    roteiro: p.roteiro ?? null,
    cenas: Array.isArray(p.cenas) && p.cenas.length > 0 ? p.cenas : null,
    texto_arte: p.texto_arte ?? null,
    briefing_arte: p.briefing_arte ?? null,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('editorial_posts' as never) as any)
    .insert(rows)
    .select('*');
  if (error) throw error;
  return ((data ?? []) as PostRow[]).map(rowToContent);
}

export async function updatePostStatus(
  supabase: SB, postId: string, status: GeneratedContent['status'],
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('editorial_posts' as never) as any)
    .update({ status })
    .eq('id', postId);
  if (error) throw error;
}

export async function rejectPostWithReason(
  supabase: SB, postId: string, reason: string,
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('editorial_posts' as never) as any)
    .update({ status: 'rejected', feedback_motivo: reason })
    .eq('id', postId);
  if (error) throw error;
}

export async function updatePostVersaoEditada(
  supabase: SB, postId: string, versao: VersaoEditada,
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('editorial_posts' as never) as any)
    .update({ versao_editada: versao })
    .eq('id', postId);
  if (error) throw error;
}

export async function updatePostFieldFeedback(
  supabase: SB, postId: string, feedback: FieldFeedback,
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('editorial_posts' as never) as any)
    .update({ field_feedback: feedback })
    .eq('id', postId);
  if (error) throw error;
}

export async function bulkApprovePosts(supabase: SB, postIds: string[]): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('editorial_posts' as never) as any)
    .update({ status: 'approved' })
    .in('id', postIds);
  if (error) throw error;
}
