import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

/**
 * Grupos de tarefas de cada área de atuação (quadro). Substituem o status
 * fixo: cada área tem os seus, renomeáveis. Uma área nova começa sem grupo.
 */
export type DemandGroup = Database['public']['Tables']['demand_groups']['Row'];

/** Paleta oferecida ao criar um grupo. */
export const GROUP_COLORS = [
  '#579BFC',
  '#00C875',
  '#FDAB3D',
  '#E2445C',
  '#A25DDC',
  '#FF642E',
  '#9CD326',
  '#66CCFF',
  '#784BD1',
  '#C4C4C4',
];

/** Grupos de uma área, na ordem de exibição. */
export const groupsOf = (groups: DemandGroup[], department: string) =>
  groups.filter((g) => g.department === department).sort((a, b) => a.position - b.position);

export async function fetchDemandGroups(): Promise<DemandGroup[]> {
  const { data, error } = await supabase
    .from('demand_groups')
    .select('*')
    .order('department')
    .order('position');
  if (error) throw error;
  return data ?? [];
}

export async function createDemandGroup(input: {
  department: string;
  name: string;
  color: string;
  position: number;
  createdBy: string | undefined;
}): Promise<DemandGroup> {
  const { data, error } = await supabase
    .from('demand_groups')
    .insert({
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

export async function renameDemandGroup(id: string, name: string) {
  const { error } = await supabase.from('demand_groups').update({ name }).eq('id', id);
  if (error) throw error;
}

/** Só chamar com o grupo vazio; a tela bloqueia antes. Se sobrar demanda, ela vai para "Sem grupo". */
export async function deleteDemandGroup(id: string) {
  const { error } = await supabase.from('demand_groups').delete().eq('id', id);
  if (error) throw error;
}
