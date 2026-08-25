import { ArtigoShell, Capa, MensagemCopiavel, SecHead, Secao } from './artigoUI';
import { MSG_INSTABILIDADE, MSG_WELLHUB_NAO_LIBERADO } from './mensagensSuporte';

/**
 * PurePedia — Mensagens Padrão - Suporte Operacional.
 *
 * TRANSCRIÇÃO FIEL do documento original (Drive: Purepedia - Artigos/Manuais).
 * O documento traz DOIS temas — "Wellhub não liberado" e "Instabilidade
 * sistêmica" — nesta ordem, e nada além disso. Não acrescentar o tema
 * "Divergência de valores e royalties": ele existe só dentro do Playbook
 * Interno Wellhub, não neste material.
 *
 * O texto vem de `mensagensSuporte.ts` porque é o MESMO das mensagens do
 * playbook (conferido: idêntico palavra por palavra). Uma fonte só evita que as
 * duas páginas divirjam com o tempo.
 */

const MENSAGENS = [MSG_WELLHUB_NAO_LIBERADO, MSG_INSTABILIDADE];

const MensagensPadraoSuporte = () => (
  <ArtigoShell>
    <Capa eyebrow="Suporte operacional" titulo="Mensagens Padrão - Suporte Operacional" />

    {MENSAGENS.map((grupo, i) => (
      <Secao key={grupo.tema} tom={i % 2 === 0 ? 'branco' : 'cinza'}>
        <SecHead titulo={grupo.tema} />
        <div className="space-y-3">
          {grupo.itens.map((m) => (
            <MensagemCopiavel key={m.rotulo} rotulo={m.rotulo} texto={m.texto} />
          ))}
        </div>
      </Secao>
    ))}
  </ArtigoShell>
);

export default MensagensPadraoSuporte;
