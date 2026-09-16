import { PainelDestinatarios } from '@/components/destinatarios/PainelDestinatarios';
import {
  useAlternarDestinatarioVerbaProfessores,
  useCriarDestinatarioVerbaProfessores,
  useDestinatariosVerbaProfessores,
  useExcluirDestinatarioVerbaProfessores,
} from './useDestinatariosVerbaProfessores';

/**
 * Quem recebe o e-mail de cada pedido de verba para novos professores.
 *
 * Só admin: a Visão Geral das Unidades só monta este painel para admin, e a RLS
 * da tabela recusa qualquer outro usuário mesmo pela API.
 */
export function DestinatariosVerbaProfessores() {
  return (
    <PainelDestinatarios
      hooks={{
        usarLista: useDestinatariosVerbaProfessores,
        usarCriar: useCriarDestinatarioVerbaProfessores,
        usarAlternar: useAlternarDestinatarioVerbaProfessores,
        usarExcluir: useExcluirDestinatarioVerbaProfessores,
      }}
      textos={{
        tituloCadastro: 'Quem recebe o e-mail dos pedidos de verba para professores',
        descricaoCadastro:
          'Quem estiver aqui e ativo recebe um e-mail a cada novo pedido de verba para novos professores. Só admins veem e alteram esta lista.',
        exemploEmail: 'rh@purepilates.com.br',
        nomeDoEnvio: 'o e-mail dos pedidos de verba para professores',
        idPrefixo: 'verba-professores',
      }}
    />
  );
}
