import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { normalizarLead, type LeadBruto, type LeadRH } from '../lib/leads';
import { carregarPreviaDeLeads } from '../dados-locais/previa';

/**
 * Leitura dos leads de RH e da lista de quem pode vê-los.
 *
 * As tabelas ainda NÃO EXISTEM: a migration
 * `supabase/migrations/20260818140000_leads_rh.sql` está escrita e não aplicada
 * (modo local). Enquanto isso, o PostgREST responde 404 com o código `PGRST205`
 * — e a tela usa `tabelasAusentes` para explicar isso em vez de mostrar "0
 * leads", que seria mentira.
 */

const LIMITE_POR_RESPOSTA = 1000;

/** O PostgREST devolve isto quando a tabela não está no schema. */
function ehTabelaAusente(erro: unknown): boolean {
  const e = erro as { code?: string; message?: string } | null;
  return e?.code === 'PGRST205' || /could not find the table/i.test(e?.message ?? '');
}

export interface LeadsRH {
  leads: LeadRH[];
  tabelasAusentes: boolean;
  /** Veio do arquivo de prévia local (só em desenvolvimento). */
  previa: boolean;
  /** Quando a prévia foi capturada da Graph API. */
  capturadoEm: string | null;
  /** Quando a carga automática rodou pela última vez. */
  sincronizadoEm: string | null;
  /** Existe agendamento (no Supabase, ou a tarefa diária local). */
  agendada: boolean;
}

type LinhaDoBanco = {
  id: string;
  criado_em: string;
  ad_id: string | null;
  ad_name: string | null;
  adset_id: string | null;
  adset_name: string | null;
  campaign_id: string | null;
  campaign_name: string | null;
  form_id: string | null;
  form_name: string | null;
  platform: string | null;
  is_organic: boolean | null;
  field_data: unknown;
  sincronizado_em: string | null;
};

/** Do formato do banco para o formato bruto da Graph API, que a lib já sabe ler. */
function comoBruto(linha: LinhaDoBanco): LeadBruto {
  return {
    id: linha.id,
    created_time: linha.criado_em,
    ad_id: linha.ad_id,
    ad_name: linha.ad_name,
    adset_id: linha.adset_id,
    adset_name: linha.adset_name,
    campaign_id: linha.campaign_id,
    campaign_name: linha.campaign_name,
    form_id: linha.form_id,
    form_name: linha.form_name,
    platform: linha.platform,
    is_organic: linha.is_organic,
    field_data: Array.isArray(linha.field_data)
      ? (linha.field_data as LeadBruto['field_data'])
      : [],
  };
}

export function useLeadsRH() {
  return useQuery({
    queryKey: ['leads-rh_leads'],
    queryFn: async (): Promise<LeadsRH> => {
      const todas: LinhaDoBanco[] = [];

      // O PostgREST corta toda resposta em 1.000 linhas. Uma campanha de RH
      // sempre passa disso com o tempo, e sem paginar a lista pararia de
      // crescer sem ninguém perceber.
      for (let inicio = 0; ; inicio += LIMITE_POR_RESPOSTA) {
        const { data, error } = await supabase
          .from('rh_leads' as never)
          .select(
            'id, criado_em, ad_id, ad_name, adset_id, adset_name, campaign_id, campaign_name, form_id, form_name, platform, is_organic, field_data, sincronizado_em',
          )
          .order('criado_em', { ascending: false })
          .range(inicio, inicio + LIMITE_POR_RESPOSTA - 1);

        if (error) {
          if (ehTabelaAusente(error)) {
            const previa = await carregarPreviaDeLeads();
            return {
              leads: previa ? previa.leads : [],
              tabelasAusentes: true,
              previa: Boolean(previa),
              capturadoEm: previa?.capturadoEm ?? null,
              sincronizadoEm: null,
              agendada: Boolean(previa?.automatica),
            };
          }
          throw error;
        }

        const lote = (data ?? []) as unknown as LinhaDoBanco[];
        todas.push(...lote);
        if (lote.length < LIMITE_POR_RESPOSTA) break;
      }

      return {
        leads: todas.map((l) => normalizarLead(comoBruto(l))),
        tabelasAusentes: false,
        previa: false,
        capturadoEm: null,
        // A carga mais recente entre as linhas: a função grava o mesmo
        // carimbo em todas do lote, então o maior é o da última execução.
        sincronizadoEm:
          todas
            .map((l) => l.sincronizado_em)
            .filter((v): v is string => Boolean(v))
            .sort()
            .pop() ?? null,
        // Sem prévia, os dados vêm do banco — e o agendamento do Supabase é
        // quem alimenta a tabela.
        agendada: true,
      };
    },
    staleTime: 1000 * 60 * 5,
  });
}

export interface Autorizado {
  id: string;
  email: string;
  nome: string | null;
  ativo: boolean;
  criado_em: string;
}

export function useAutorizados() {
  return useQuery({
    queryKey: ['leads-rh_autorizados'],
    queryFn: async (): Promise<{ lista: Autorizado[]; tabelasAusentes: boolean }> => {
      const { data, error } = await supabase
        .from('rh_leads_autorizados' as never)
        .select('id, email, nome, ativo, criado_em')
        .order('email');

      if (error) {
        if (ehTabelaAusente(error)) return { lista: [], tabelasAusentes: true };
        throw error;
      }

      return { lista: (data ?? []) as unknown as Autorizado[], tabelasAusentes: false };
    },
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Se ESTE usuário pode ver os leads.
 *
 * Quem manda é a RLS: mesmo que a tela mostrasse tudo, o banco não devolveria
 * linha para quem não está na lista. Este hook existe para a tela poder
 * explicar a ausência, e não para autorizar nada.
 */
export function usePodeVerLeads() {
  const { user, isAdmin } = useAuth();
  const { data: autorizados } = useAutorizados();

  if (isAdmin) return { pode: true, motivo: 'admin' as const };

  const email = user?.email?.toLowerCase();
  const naLista = autorizados?.lista.some((a) => a.ativo && a.email.toLowerCase() === email);

  return {
    pode: Boolean(naLista),
    motivo: naLista ? ('autorizado' as const) : ('sem-acesso' as const),
  };
}

export function useGerenciarAutorizados() {
  const cliente = useQueryClient();
  const { user } = useAuth();

  const recarregar = () => cliente.invalidateQueries({ queryKey: ['leads-rh_autorizados'] });

  const adicionar = useMutation({
    mutationFn: async ({ email, nome }: { email: string; nome: string }) => {
      const { error } = await supabase.from('rh_leads_autorizados' as never).insert({
        email: email.trim().toLowerCase(),
        nome: nome.trim() || null,
        ativo: true,
        criado_por: user?.id ?? null,
      } as never);
      if (error) throw error;
    },
    onSuccess: recarregar,
  });

  const alternarAtivo = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from('rh_leads_autorizados' as never)
        .update({ ativo } as never)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: recarregar,
  });

  const remover = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('rh_leads_autorizados' as never).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: recarregar,
  });

  return { adicionar, alternarAtivo, remover };
}
