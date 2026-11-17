// Assets de marca: a biblioteca de logos e elementos da marca, organizada por
// unidade de negócio (como os kits de marca do Canva). Só o time vê e gerencia
// — o banco garante isso (RLS em public.marca_assets). O agente do Pure Design
// lê a biblioteca no servidor e escolhe o logo de cada arte.

import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

/** A tabela é nova e ainda não está nos tipos gerados do Supabase. */
const db = supabase as unknown as SupabaseClient;

export const BUCKET = 'marca-assets';

/** As "pastas" da biblioteca, na ordem em que aparecem (as mesmas do Canva). */
export const UNIDADES = ['Pure Pilates', 'Pure Store', 'Pure Academy', 'Pure Franchising', 'Pilates Play'] as const;

export const TIPOS = [
  { id: 'logo', nome: 'Logo' },
  { id: 'selo', nome: 'Selo' },
  { id: 'grafismo', nome: 'Grafismo' },
  { id: 'icone', nome: 'Ícone' },
  { id: 'outro', nome: 'Outro' },
] as const;

export interface MarcaAsset {
  id: string;
  unidade: string;
  subpasta: string | null;
  nome: string;
  tipo: string;
  descricao: string;
  arquivo_path: string;
  url: string;
  largura: number | null;
  altura: number | null;
  ativo: boolean;
  created_at: string;
}

export async function listarAssets(): Promise<MarcaAsset[]> {
  const { data, error } = await db
    .from('marca_assets')
    .select('*')
    .order('unidade')
    .order('subpasta', { nullsFirst: true })
    .order('nome');
  if (error) throw error;
  return (data ?? []) as MarcaAsset[];
}

/** Largura e altura da imagem, para o agente saber se o logo é horizontal ou quadrado. */
function medir(arquivo: File): Promise<{ largura: number; altura: number } | null> {
  return new Promise((ok) => {
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = () => {
      ok({ largura: img.naturalWidth, altura: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      ok(null);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

const fatia = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export async function enviarAsset(entrada: {
  arquivo: File;
  unidade: string;
  subpasta?: string;
  nome: string;
  tipo: string;
  descricao: string;
}): Promise<void> {
  const ext = entrada.arquivo.name.split('.').pop()?.toLowerCase() || 'png';
  const caminho = [fatia(entrada.unidade), entrada.subpasta ? fatia(entrada.subpasta) : null, `${fatia(entrada.nome)}-${Date.now()}.${ext}`]
    .filter(Boolean)
    .join('/');
  const { error: erroArquivo } = await db.storage.from(BUCKET).upload(caminho, entrada.arquivo, {
    contentType: entrada.arquivo.type || undefined,
    upsert: false,
  });
  if (erroArquivo) throw erroArquivo;
  const url = db.storage.from(BUCKET).getPublicUrl(caminho).data.publicUrl;
  const medidas = await medir(entrada.arquivo);
  const { data: sessao } = await supabase.auth.getUser();
  const { error } = await db.from('marca_assets').insert({
    unidade: entrada.unidade,
    subpasta: entrada.subpasta?.trim() || null,
    nome: entrada.nome.trim(),
    tipo: entrada.tipo,
    descricao: entrada.descricao.trim(),
    arquivo_path: caminho,
    url,
    largura: medidas?.largura ?? null,
    altura: medidas?.altura ?? null,
    created_by: sessao.user?.id ?? null,
  });
  if (error) {
    // Sem a linha, o arquivo fica órfão: tira do bucket.
    await db.storage.from(BUCKET).remove([caminho]);
    throw error;
  }
}

export async function atualizarAsset(
  id: string,
  campos: Partial<Pick<MarcaAsset, 'nome' | 'descricao' | 'tipo' | 'subpasta' | 'unidade' | 'ativo'>>,
): Promise<void> {
  const { error } = await db.from('marca_assets').update(campos).eq('id', id);
  if (error) throw error;
}

export async function apagarAsset(a: MarcaAsset): Promise<void> {
  const { error } = await db.from('marca_assets').delete().eq('id', a.id);
  if (error) throw error;
  await db.storage.from(BUCKET).remove([a.arquivo_path]);
}
