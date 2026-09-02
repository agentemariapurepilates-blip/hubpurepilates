import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { pedirPrevia, pedirTeste, type Invocar } from '../lib/pedidos';
import type { HooksDaPrevia } from '../PreviaDoRelatorio';

/**
 * Liga a PreviaDoRelatorio à Edge Function de um relatório.
 *
 * Uma fábrica, e não dois hooks escritos à mão: os dois relatórios têm
 * comportamento idêntico e só mudam o nome da função. A regra de conversa com
 * a function mora em lib/pedidos.ts, que é onde ela é testada.
 */
export function criarHooksDePrevia(funcao: string): HooksDaPrevia {
  const invocar: Invocar = (nome, opcoes) => supabase.functions.invoke(nome, opcoes);

  // Definidos como `useX`, e só depois entregues com os nomes de prop `usarX`.
  // Não é enfeite: a regra rules-of-hooks do eslint só consegue verificar uma
  // função se o nome dela começa com `use`, e uma propriedade `usarPrevia:` na
  // saída faria a checagem desistir em silêncio. Mesmo arranjo de
  // criarHooksDeDestinatarios.
  const usePrevia = () =>
    useQuery({
      queryKey: ['previa-relatorio', funcao],
      queryFn: () => pedirPrevia(invocar, funcao),
      // A function ausente devolve o mesmo erro em toda tentativa, e as três
      // repetições padrão só atrasariam o aviso na tela em alguns segundos.
      retry: false,
      // Montar a prévia lê os dois bancos e ~475 unidades. Refazer isso a cada
      // foco de janela seria caro para um dado que muda uma vez por mês.
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    });

  const useTeste = () =>
    useMutation({
      mutationFn: () => pedirTeste(invocar, funcao),
      onSuccess: () =>
        toast.success('Teste enviado', {
          description: 'O e-mail foi só para você — a lista de destinatários não recebeu nada.',
        }),
      onError: (erro: unknown) =>
        toast.error('Não deu para enviar o teste', {
          description: erro instanceof Error ? erro.message : String(erro),
        }),
    });

  return { usarPrevia: usePrevia, usarTeste: useTeste };
}
