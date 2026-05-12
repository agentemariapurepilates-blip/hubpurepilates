// ============================================================================
// Wrappers das edge functions do agente editorial.
// Cada funcao chama supabase.functions.invoke(...) e retorna o payload util.
// Tratamento de erro fica no caller (pra ele controlar UI/toast).
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import { SceneEntry, RefinementEntry, FieldKey } from '../types';

// deno-lint-ignore no-explicit-any
type SB = SupabaseClient<any, any, any>;

// --- generate-editorial-plan: gera SOMENTE temas (titulo + tipo + briefing) ---

export interface GenerateThemesBody {
  month: string;
  year: string;
  networks: string[];
  instructions?: string;
  editorialGuide?: string;
}

export interface GeneratedTheme {
  date: string;
  network: string;
  title: string;
  description: string;
  content_type?: string;
  // Os campos abaixo nao deveriam vir nessa etapa, mas a edge function permite.
  legenda?: string;
  roteiro?: string;
  cenas?: SceneEntry[];
  texto_arte?: string;
  briefing_arte?: string;
}

export async function invokeGenerateEditorialPlan(
  supabase: SB, body: GenerateThemesBody,
): Promise<GeneratedTheme[]> {
  const { data, error } = await supabase.functions.invoke('generate-editorial-plan', { body });
  if (error) throw error;
  const posts = (data?.posts ?? []) as GeneratedTheme[];
  if (!posts.length) throw new Error('Nenhum conteúdo retornado.');
  return posts;
}

// --- generate-post-content: gera o conteudo completo de UM tema aprovado ---

export interface GeneratedContent {
  legenda?: string | null;
  roteiro?: string | null;
  cenas?: SceneEntry[] | null;
  texto_arte?: string | null;
  briefing_arte?: string | null;
}

export async function invokeGeneratePostContent(
  supabase: SB, postId: string, editorialGuide?: string,
): Promise<GeneratedContent> {
  const { data, error } = await supabase.functions.invoke('generate-post-content', {
    body: { post_id: postId, editorialGuide },
  });
  if (error) throw error;
  return (data?.content ?? {}) as GeneratedContent;
}

// --- refine-editorial-post: refina post inteiro ou um campo especifico ---

export interface RefineResult {
  refined: {
    title?: string;
    description?: string;
    content_type?: string;
    legenda?: string;
    roteiro?: string;
    cenas?: SceneEntry[];
    texto_arte?: string;
    briefing_arte?: string;
  };
  refinement?: RefinementEntry;
}

export async function invokeRefineEditorialPost(
  supabase: SB, postId: string, prompt: string, field?: FieldKey,
): Promise<RefineResult> {
  const { data, error } = await supabase.functions.invoke('refine-editorial-post', {
    body: { post_id: postId, prompt, ...(field ? { field } : {}) },
  });
  if (error) throw error;
  return {
    refined: data?.refined ?? {},
    refinement: data?.refinement as RefinementEntry | undefined,
  };
}
