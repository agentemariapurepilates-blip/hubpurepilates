import { PainelDestinatarios } from '@/components/destinatarios/PainelDestinatarios';
import {
  useAlternarDestinatarioMidiaLocal,
  useCriarDestinatarioMidiaLocal,
  useDestinatariosMidiaLocal,
  useExcluirDestinatarioMidiaLocal,
} from './useDestinatariosMidiaLocal';

/**
 * Quem recebe o e-mail de cada pedido de mídia local (a Rise).
 *
 * Só admin: a Visão Geral das Unidades só monta este painel para admin, e a RLS
 * da tabela recusa qualquer outro usuário mesmo pela API.
 */
export function DestinatariosMidiaLocal() {
  return (
    <PainelDestinatarios
      hooks={{
        usarLista: useDestinatariosMidiaLocal,
        usarCriar: useCriarDestinatarioMidiaLocal,
        usarAlternar: useAlternarDestinatarioMidiaLocal,
        usarExcluir: useExcluirDestinatarioMidiaLocal,
      }}
      textos={{
        tituloCadastro: 'Quem recebe o e-mail dos pedidos de mídia local',
        descricaoCadastro:
          'Quem estiver aqui e ativo recebe um e-mail a cada novo pedido de mídia local na TV Globo (a Rise). O franqueado fica como "responder para". Só admins veem e alteram esta lista.',
        exemploEmail: 'contato@risead.com.br',
        nomeDoEnvio: 'o e-mail dos pedidos de mídia local',
        idPrefixo: 'midia-local',
      }}
    />
  );
}
