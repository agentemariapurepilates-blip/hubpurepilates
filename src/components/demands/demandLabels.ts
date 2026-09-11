import { createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

/**
 * Etiquetas coloridas das demandas.
 *
 * - frente: Frente de negócio. Lista única do Hub (department nulo): Academy é
 *   Academy em qualquer setor, e renomear num lugar muda em todos.
 * - status: Status por etiqueta. Lista de cada setor, para os setores cujo fluxo
 *   não cabe nos grupos (hoje, Gravações). Os demais usam os grupos como status.
 *
 * Cada setor liga as colunas que usa (demand_board_settings); onde não está
 * ligada, a coluna não aparece nem na lista nem no formulário.
 */
export type LabelKind = 'status' | 'frente';
export type DemandLabel = Database['public']['Tables']['demand_labels']['Row'];
export type BoardSettings = Database['public']['Tables']['demand_board_settings']['Row'];
export type BoardFlag = 'show_status_labels' | 'show_frente';

export const LABEL_TITULO: Record<LabelKind, string> = {
  status: 'Status',
  frente: 'Frente de negócio',
};

/** Paleta do seletor de cor: as cores das etiquetas do Monday, em ordem de tom. */
export const LABEL_COLORS = [
  '#C9424E',
  '#A83F55',
  '#E43A7D',
  '#E8784A',
  '#EFAE56',
  '#F5CC47',
  '#A8D14A',
  '#5EC47B',
  '#3B7E55',
  '#66CCFF',
  '#6A9DF5',
  '#3C7BB0',
  '#5859DA',
  '#9558D6',
  '#9D99B9',
  '#EAA6EE',
  '#BAA68A',
  '#7A5347',
  '#553F3F',
  '#C4C4C4',
  '#777777',
  '#333333',
];

/** Primeira cor da paleta que a lista ainda não usa: a etiqueta nova já nasce diferente das outras. */
export const proximaCor = (usadas: string[]) =>
  LABEL_COLORS.find((c) => !usadas.some((u) => u.toLowerCase() === c.toLowerCase())) ?? LABEL_COLORS[0];

/**
 * Cor do texto sobre a etiqueta. Branco, como no Monday; escuro só nas cores bem
 * claras (amarelo, lima, cinza claro, rosa claro), onde o branco some.
 */
export function corDoTexto(hex: string) {
  const h = hex.replace('#', '');
  if (h.length !== 6) return '#ffffff';
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const linear = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminancia = 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
  return luminancia > 0.5 ? '#1f2937' : '#ffffff';
}

/** Opções de um tipo, na ordem. A Frente ignora o setor; o Status é do setor. */
export const labelsFor = (labels: DemandLabel[], kind: LabelKind, department: string | null) =>
  labels
    .filter((l) => l.kind === kind && (kind === 'frente' ? l.department === null : l.department === department))
    .sort((a, b) => a.position - b.position);

/** Colunas ligadas num setor. Setor sem configuração não mostra nenhuma. */
export const flagsFor = (settings: BoardSettings[], department: string | null) => {
  const s = department ? settings.find((x) => x.department === department) : undefined;
  return {
    show_status_labels: s?.show_status_labels ?? false,
    show_frente: s?.show_frente ?? false,
  };
};

export async function fetchLabels(): Promise<DemandLabel[]> {
  const { data, error } = await supabase.from('demand_labels').select('*').order('position');
  if (error) throw error;
  return data ?? [];
}

export async function fetchBoardSettings(): Promise<BoardSettings[]> {
  const { data, error } = await supabase.from('demand_board_settings').select('*');
  if (error) throw error;
  return data ?? [];
}

export async function createLabel(input: {
  kind: LabelKind;
  department: string | null;
  name: string;
  color: string;
  position: number;
  createdBy: string | undefined;
}): Promise<DemandLabel> {
  const { data, error } = await supabase
    .from('demand_labels')
    .insert({
      kind: input.kind,
      department: input.department,
      name: input.name,
      color: input.color,
      position: input.position,
      created_by: input.createdBy ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateLabel(id: string, patch: { name?: string; color?: string }) {
  const { error } = await supabase.from('demand_labels').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteLabel(id: string) {
  const { error } = await supabase.from('demand_labels').delete().eq('id', id);
  if (error) throw error;
}

/** Liga ou desliga uma coluna no setor. Só mexe na coluna pedida; a outra fica como está. */
export async function saveBoardFlag(department: string, flag: BoardFlag, value: boolean): Promise<BoardSettings> {
  const agora = new Date().toISOString();
  const payload =
    flag === 'show_frente'
      ? { department, show_frente: value, updated_at: agora }
      : { department, show_status_labels: value, updated_at: agora };
  const { data, error } = await supabase
    .from('demand_board_settings')
    .upsert(payload, { onConflict: 'department' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** O que a página expõe para a lista, a demanda e os formulários. */
export interface DemandLabelsApi {
  labels: DemandLabel[];
  settings: BoardSettings[];
  criar: (kind: LabelKind, department: string | null, name: string, color: string) => Promise<void>;
  atualizar: (id: string, patch: { name?: string; color?: string }) => Promise<void>;
  excluir: (label: DemandLabel) => Promise<void>;
  /** Escolhe (ou limpa, com null) a etiqueta de uma demanda e grava na hora. */
  definir: (demandId: string, kind: LabelKind, labelId: string | null) => Promise<void>;
  alternar: (department: string, flag: BoardFlag, value: boolean) => Promise<void>;
}

export const DemandLabelsContext = createContext<DemandLabelsApi | null>(null);

// Fora da página de demandas: sem etiquetas e sem colunas, em vez de derrubar a tela.
const SEM_ETIQUETAS: DemandLabelsApi = {
  labels: [],
  settings: [],
  criar: async () => {},
  atualizar: async () => {},
  excluir: async () => {},
  definir: async () => {},
  alternar: async () => {},
};

export const useDemandLabels = (): DemandLabelsApi => useContext(DemandLabelsContext) ?? SEM_ETIQUETAS;
