import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { DestinatarioAviso } from '../types';

// Duas listas de destinatários, com o MESMO comportamento e tabelas diferentes:
//
//   - aviso diário     → inauguracao_email_recipients      (todo dia, 3h)
//   - relatório semanal → inauguracao_relatorio_recipients  (segunda, 7h)
//
// Por isso os hooks saem de uma fábrica em vez de existirem duas vezes: o
// tratamento de erro aqui é sutil (recusa silenciosa da RLS, e-mail duplicado,
// tabela ausente) e duplicá-lo garantiria que uma cópia divergisse da outra na
// primeira correção.
//
// As tabelas ainda não existem nos tipos gerados (supabase/types.ts), daí o
// `as never` no `.from(...)` — mesmo padrão de useInauguracoes.ts.

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

interface ConfiguracaoDaLista {
  /** Nome da tabela no Postgres. */
  tabela: string;
  /** Chave do cache do react-query — separada por lista. */
  queryKey: string[];
  /** Migration citada na mensagem enquanto a tabela não existir. */
  migration: string;
  /** Como a lista se chama nas mensagens ("Destinatários", "Relatório semanal"). */
  rotulo: string;
}

export function criarHooksDeDestinatarios({ tabela, queryKey, migration, rotulo }: ConfiguracaoDaLista) {
  const mensagemDeErro = (error: ErroSupabase): string => {
    if (tabelaNaoExiste(error)) {
      return `A tabela de ${rotulo} ainda não existe no Supabase. Peça para alguém aplicar a migration "${migration}".`;
    }
    if (emailDuplicado(error)) return MENSAGEM_EMAIL_DUPLICADO;
    return error.message || 'Ocorreu um erro inesperado.';
  };

  /**
   * Lista os destinatários.
   *
   * Não filtra por `ativo`: a tela mostra todo mundo para o admin poder
   * reativar quem já esteve na lista. Quem filtra por `ativo` é quem envia.
   */
  const useLista = () =>
    useQuery({
      queryKey,
      queryFn: async (): Promise<DestinatarioAviso[]> => {
        const { data, error } = await supabase
          .from(tabela as never)
          .select('*')
          .order('email', { ascending: true });

        if (error) throw new Error(mensagemDeErro(error));
        return (data as unknown as DestinatarioAviso[]) ?? [];
      },
    });

  /** Cadastra um novo destinatário em nome do admin logado. */
  const useCriar = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
      mutationFn: async (novo: { email: string; nome: string | null }): Promise<DestinatarioAviso> => {
        if (!user) throw new Error('É preciso estar autenticado para cadastrar um destinatário.');

        const { data, error } = await supabase
          .from(tabela as never)
          .insert({ ...novo, created_by: user.id } as never)
          .select()
          .single();

        if (error) throw new Error(mensagemDeErro(error));
        return data as unknown as DestinatarioAviso;
      },
      onSuccess: () => {
        toast.success('Destinatário adicionado.');
        queryClient.invalidateQueries({ queryKey });
      },
      onError: (error: Error) => toast.error(error.message),
    });
  };

  /**
   * Ativa ou desativa um destinatário.
   *
   * A RLS destas tabelas é só-admin: quem não é admin recebe sucesso com zero
   * linhas em vez de erro. Por isso o `.select()` e a checagem do array — sem
   * isso a tela diria "salvo!" sem ter mudado nada.
   */
  const useAlternar = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }): Promise<DestinatarioAviso> => {
        const { data, error } = await supabase
          .from(tabela as never)
          .update({ ativo } as never)
          .eq('id', id)
          .select();

        if (error) throw new Error(mensagemDeErro(error));

        const linhas = (data as unknown as DestinatarioAviso[]) ?? [];
        if (linhas.length === 0) throw new Error(MENSAGEM_SEM_PERMISSAO);
        return linhas[0];
      },
      onSuccess: () => queryClient.invalidateQueries({ queryKey }),
      onError: (error: Error) => toast.error(error.message),
    });
  };

  /** Exclui um destinatário. Mesma checagem de recusa silenciosa da RLS. */
  const useExcluir = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async (id: string): Promise<void> => {
        const { data, error } = await supabase
          .from(tabela as never)
          .delete()
          .eq('id', id)
          .select();

        if (error) throw new Error(mensagemDeErro(error));

        const linhas = (data as unknown as DestinatarioAviso[]) ?? [];
        if (linhas.length === 0) throw new Error(MENSAGEM_SEM_PERMISSAO);
      },
      onSuccess: () => {
        toast.success('Destinatário excluído.');
        queryClient.invalidateQueries({ queryKey });
      },
      onError: (error: Error) => toast.error(error.message),
    });
  };

  return { useLista, useCriar, useAlternar, useExcluir };
}

// ---------------------------------------------------------------------------
// Aviso diário de inauguração (o que já existia)
// ---------------------------------------------------------------------------
const aviso = criarHooksDeDestinatarios({
  tabela: 'inauguracao_email_recipients',
  queryKey: ['inauguracao_destinatarios'],
  migration: '20260801140000_inauguracao_email_recipients.sql',
  rotulo: 'Destinatários',
});

export const useDestinatarios = aviso.useLista;
export const useCriarDestinatario = aviso.useCriar;
export const useAlternarDestinatario = aviso.useAlternar;
export const useExcluirDestinatario = aviso.useExcluir;

// ---------------------------------------------------------------------------
// Relatório semanal
// ---------------------------------------------------------------------------
const relatorio = criarHooksDeDestinatarios({
  tabela: 'inauguracao_relatorio_recipients',
  queryKey: ['inauguracao_destinatarios_relatorio'],
  migration: '20260804190000_inauguracao_relatorio_recipients.sql',
  rotulo: 'Relatório semanal',
});

export const useDestinatariosRelatorio = relatorio.useLista;
export const useCriarDestinatarioRelatorio = relatorio.useCriar;
export const useAlternarDestinatarioRelatorio = relatorio.useAlternar;
export const useExcluirDestinatarioRelatorio = relatorio.useExcluir;

// As duas listas usam queryKey diferente de propósito: com a mesma chave, o
// react-query serviria o cache de uma na tela da outra.
export const CHAVES_DE_CACHE = {
  aviso: ['inauguracao_destinatarios'],
  relatorio: ['inauguracao_destinatarios_relatorio'],
} as const;
