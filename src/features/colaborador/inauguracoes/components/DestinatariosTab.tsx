import {
  useAlternarDestinatario,
  useCriarDestinatario,
  useDestinatarios,
  useExcluirDestinatario,
} from '../hooks/useDestinatarios';
import { PainelDestinatarios } from '@/components/destinatarios/PainelDestinatarios';

/**
 * "Destinatários" de /inauguracoes — quem recebe o aviso de inauguração por
 * e-mail (todo dia às 3h). Só admin chega aqui: o item some do menu para
 * colaborador e a RLS da tabela bloqueia o acesso direto.
 *
 * A tela em si vive em PainelDestinatarios, compartilhada com o relatório
 * semanal — as duas listas se comportam igual e diferem só no texto.
 */
export function DestinatariosTab() {
  return (
    <PainelDestinatarios
      hooks={{
        usarLista: useDestinatarios,
        usarCriar: useCriarDestinatario,
        usarAlternar: useAlternarDestinatario,
        usarExcluir: useExcluirDestinatario,
      }}
      textos={{
        tituloCadastro: 'Novo destinatário',
        descricaoCadastro:
          'Quem estiver aqui e ativo recebe o e-mail de aviso no dia da inauguração de cada unidade.',
        exemploEmail: 'marketing@purepilates.com.br',
        nomeDoEnvio: 'o aviso de inauguração',
        idPrefixo: 'destinatario',
      }}
    />
  );
}
