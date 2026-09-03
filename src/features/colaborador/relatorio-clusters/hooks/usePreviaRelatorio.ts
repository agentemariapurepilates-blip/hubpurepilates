import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { pedirTeste, type Invocar } from '../lib/pedidos';
import type { HooksDaPrevia } from '../PreviaDoRelatorio';

/**
 * Liga a PreviaDoRelatorio às duas metades do relatório, que têm exigências
 * bem diferentes:
 *
 *   A PRÉVIA é montada no navegador (ver usePreviaDosRelatorios, na pasta de
 *   indicadores). Não depende de nada publicado — os números vêm do banco de
 *   indicadores, que o Hub já lê, e o HTML sai do mesmo email.ts da function.
 *
 *   O TESTE precisa da Edge Function no ar: só ela alcança a lista de
 *   destinatários no banco do Hub (atrás de RLS) e o token do webhook do n8n.
 *
 * Foi essa separação que tirou a tela da fila do deploy: dá para conferir o
 * e-mail hoje, e publicar quando for a hora.
 */
export function criarHooksDePrevia(funcao: string, usePrevia: HooksDaPrevia['usarPrevia']): HooksDaPrevia {
  const invocar: Invocar = (nome, opcoes) => supabase.functions.invoke(nome, opcoes);

  // Definido como `useX` e só depois entregue como `usarTeste`: a regra
  // rules-of-hooks do eslint só verifica funções cujo nome começa com `use`, e
  // uma propriedade `usarTeste:` faria a checagem desistir em silêncio.
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
