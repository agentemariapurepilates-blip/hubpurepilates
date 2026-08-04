import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { InauguracaoRequest, NovaInauguracao } from '../types';

// `inauguracao_requests` é do banco do Hub (`supabase` de
// @/integrations/supabase/client) — não confundir com `supabaseIndicadores`,
// que é outro projeto e não tem essa tabela.
//
// A tabela ainda não existe nos tipos gerados (supabase/types.ts), por isso o
// `as never` no `.from(...)`, igual ao padrão já usado em
// src/features/admin/midia-adicional/*.tsx para as tabelas `dpp_*`.
const TABELA = 'inauguracao_requests';

// Nome do arquivo citado na mensagem enquanto a migration não for aplicada.
const ARQUIVO_DA_MIGRATION = '20260731120000_inauguracao_requests.sql';

const MENSAGEM_TABELA_AUSENTE =
  `A tabela de Inaugurações ainda não existe no Supabase. Peça para alguém aplicar a migration "${ARQUIVO_DA_MIGRATION}".`;

const MENSAGEM_FORA_DO_PRAZO =
  'Fora do prazo de alteração. Entre em contato com o marketing.';

interface ErroSupabase {
  code?: string;
  message?: string;
}

/** A relação não existe no banco — a migration ainda não foi aplicada. */
function tabelaNaoExiste(error: ErroSupabase): boolean {
  return error.code === '42P01' || (error.message ?? '').includes('does not exist');
}

/** Traduz o erro do Supabase para uma mensagem que o usuário entende. */
function mensagemDeErro(error: ErroSupabase): string {
  if (tabelaNaoExiste(error)) return MENSAGEM_TABELA_AUSENTE;
  return error.message || 'Ocorreu um erro inesperado.';
}

/**
 * Lista as solicitações de inauguração.
 *
 * Não filtra por usuário no código: a RLS já devolve só o que a pessoa pode
 * ver (colaborador vê as suas, admin vê todas). Filtrar de novo aqui criaria
 * duas fontes de verdade que podem divergir, além de sugerir — errado — que a
 * segurança está no frontend.
 */
export function useInauguracoes() {
  return useQuery({
    queryKey: ['inauguracoes'],
    queryFn: async (): Promise<InauguracaoRequest[]> => {
      const { data, error } = await supabase
        .from(TABELA as never)
        .select('*')
        .order('data_inauguracao', { ascending: true });

      if (error) throw new Error(mensagemDeErro(error));
      return (data as unknown as InauguracaoRequest[]) ?? [];
    },
  });
}

/** Cria uma solicitação de inauguração em nome do usuário logado. */
export function useCriarInauguracao() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (nova: NovaInauguracao): Promise<InauguracaoRequest> => {
      if (!user) throw new Error('É preciso estar autenticado para registrar uma inauguração.');

      const { data, error } = await supabase
        .from(TABELA as never)
        .insert({ ...nova, user_id: user.id } as never)
        .select()
        .single();

      if (error) throw new Error(mensagemDeErro(error));
      return data as unknown as InauguracaoRequest;
    },
    onSuccess: () => {
      toast.success('Inauguração registrada.');
      queryClient.invalidateQueries({ queryKey: ['inauguracoes'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/**
 * Edita uma solicitação existente.
 *
 * Fora do prazo de alteração, a RLS não devolve erro: devolve sucesso com zero
 * linhas afetadas. Por isso o `.select()` no update e a checagem do array —
 * sem isso a tela diria "salvo!" sem ter mudado nada.
 */
export function useEditarInauguracao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...alteracoes
    }: Partial<NovaInauguracao> & { id: string }): Promise<InauguracaoRequest> => {
      const { data, error } = await supabase
        .from(TABELA as never)
        .update(alteracoes as never)
        .eq('id', id)
        .select();

      if (error) throw new Error(mensagemDeErro(error));

      const linhas = (data as unknown as InauguracaoRequest[]) ?? [];
      if (linhas.length === 0) throw new Error(MENSAGEM_FORA_DO_PRAZO);
      return linhas[0];
    },
    onSuccess: () => {
      toast.success('Inauguração atualizada.');
      queryClient.invalidateQueries({ queryKey: ['inauguracoes'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/**
 * Exclui uma solicitação existente.
 *
 * Mesmo caso do update: fora do prazo a RLS devolve sucesso com zero
 * linhas em vez de erro, então o `.select()` no delete é o que permite
 * detectar a recusa silenciosa.
 */
export function useExcluirInauguracao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { data, error } = await supabase
        .from(TABELA as never)
        .delete()
        .eq('id', id)
        .select();

      if (error) throw new Error(mensagemDeErro(error));

      const linhas = (data as unknown as InauguracaoRequest[]) ?? [];
      if (linhas.length === 0) throw new Error(MENSAGEM_FORA_DO_PRAZO);
    },
    onSuccess: () => {
      toast.success('Inauguração excluída.');
      queryClient.invalidateQueries({ queryKey: ['inauguracoes'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
