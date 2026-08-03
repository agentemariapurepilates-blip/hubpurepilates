import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { DestinatarioAviso } from '../types';

// `inauguracao_email_recipients` é do banco do Hub (`supabase` de
// @/integrations/supabase/client). A tabela ainda não existe nos tipos
// gerados (supabase/types.ts), por isso o `as never` no `.from(...)`, mesmo
// padrão de useInauguracoes.ts.
const TABELA = 'inauguracao_email_recipients';

// Nome do arquivo citado na mensagem enquanto a migration não for aplicada.
const ARQUIVO_DA_MIGRATION = '20260801140000_inauguracao_email_recipients.sql';

const MENSAGEM_TABELA_AUSENTE =
  `A tabela de Destinatários ainda não existe no Supabase. Peça para alguém aplicar a migration "${ARQUIVO_DA_MIGRATION}".`;

const MENSAGEM_EMAIL_DUPLICADO = 'Este e-mail já está na lista.';

const MENSAGEM_SEM_PERMISSAO =
  'Não foi possível concluir. Confirme que você tem acesso de administrador.';

interface ErroSupabase {
  code?: string;
  message?: string;
}

/** A relação não existe no banco — a migration ainda não foi aplicada. */
function tabelaNaoExiste(error: ErroSupabase): boolean {
  return error.code === '42P01' || (error.message ?? '').includes('does not exist');
}

/** Violação do UNIQUE (email) — alguém tentou cadastrar um e-mail repetido. */
function emailDuplicado(error: ErroSupabase): boolean {
  return error.code === '23505';
}

/** Traduz o erro do Supabase para uma mensagem que o admin entende. */
function mensagemDeErro(error: ErroSupabase): string {
  if (tabelaNaoExiste(error)) return MENSAGEM_TABELA_AUSENTE;
  if (emailDuplicado(error)) return MENSAGEM_EMAIL_DUPLICADO;
  return error.message || 'Ocorreu um erro inesperado.';
}

const QUERY_KEY = ['inauguracao_destinatarios'];

/**
 * Lista os destinatários do aviso de inauguração.
 *
 * Não filtra por `ativo` aqui: a aba mostra todo mundo (ativo e inativo) para
 * o admin poder reativar quem já esteve na lista. Quem filtra por `ativo` é
 * o workflow do n8n, que lê direto do banco com a chave de serviço.
 */
export function useDestinatarios() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<DestinatarioAviso[]> => {
      const { data, error } = await supabase
        .from(TABELA as never)
        .select('*')
        .order('email', { ascending: true });

      if (error) throw new Error(mensagemDeErro(error));
      return (data as unknown as DestinatarioAviso[]) ?? [];
    },
  });
}

/** Cadastra um novo destinatário em nome do admin logado. */
export function useCriarDestinatario() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (novo: {
      email: string;
      nome: string | null;
    }): Promise<DestinatarioAviso> => {
      if (!user) throw new Error('É preciso estar autenticado para cadastrar um destinatário.');

      const { data, error } = await supabase
        .from(TABELA as never)
        .insert({ ...novo, created_by: user.id } as never)
        .select()
        .single();

      if (error) throw new Error(mensagemDeErro(error));
      return data as unknown as DestinatarioAviso;
    },
    onSuccess: () => {
      toast.success('Destinatário adicionado.');
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/**
 * Ativa ou desativa um destinatário.
 *
 * A RLS desta tabela é só-admin (ver a migration): quem não é admin recebe
 * sucesso com zero linhas em vez de erro, igual ao padrão de
 * useInauguracoes.ts. Por isso o `.select()` no update e a checagem do
 * array — sem isso a tela diria "salvo!" sem ter mudado nada.
 */
export function useAlternarDestinatario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ativo,
    }: {
      id: string;
      ativo: boolean;
    }): Promise<DestinatarioAviso> => {
      const { data, error } = await supabase
        .from(TABELA as never)
        .update({ ativo } as never)
        .eq('id', id)
        .select();

      if (error) throw new Error(mensagemDeErro(error));

      const linhas = (data as unknown as DestinatarioAviso[]) ?? [];
      if (linhas.length === 0) throw new Error(MENSAGEM_SEM_PERMISSAO);
      return linhas[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/** Exclui um destinatário. Mesma checagem de recusa silenciosa da RLS. */
export function useExcluirDestinatario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { data, error } = await supabase
        .from(TABELA as never)
        .delete()
        .eq('id', id)
        .select();

      if (error) throw new Error(mensagemDeErro(error));

      const linhas = (data as unknown as DestinatarioAviso[]) ?? [];
      if (linhas.length === 0) throw new Error(MENSAGEM_SEM_PERMISSAO);
    },
    onSuccess: () => {
      toast.success('Destinatário excluído.');
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
