import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, MessageSquareText } from 'lucide-react';

import arquivo from '../dados/criativos.json';
import {
  agruparPorCampanha,
  defeitosDosCriativos,
  lerCriativo,
  type AnuncioBruto,
  type Uso,
} from '../lib/criativos';

/**
 * O botão do anúncio, como o Meta chama e como o público lê.
 *
 * `BOOK_TRAVEL` assusta na primeira leitura — parece anúncio de viagem —, mas é
 * o código que o Meta usa para o botão "Reservar", e é ele que leva ao
 * agendamento da aula experimental. Está certo; só tem nome ruim.
 */
const BOTOES: Record<string, string> = {
  BOOK_TRAVEL: 'Reservar',
  SIGN_UP: 'Cadastre-se',
  LEARN_MORE: 'Saiba mais',
  MESSAGE_PAGE: 'Enviar mensagem',
  WHATSAPP_MESSAGE: 'WhatsApp',
  SHOP_NOW: 'Comprar',
  SUBSCRIBE: 'Assinar',
};

/** Um texto do anúncio, com a marca de quantas peças o usam. */
function Texto({ uso, total }: { uso: Uso; total: number }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="whitespace-pre-line text-sm leading-relaxed">{uso.texto}</p>
      {total > 1 ? (
        <p className="mt-2 text-xs text-muted-foreground">
          {uso.anuncios === 1 ? 'em 1 anúncio' : `em ${uso.anuncios} anúncios`}
        </p>
      ) : null}
    </div>
  );
}

/** Uma lista curta de títulos ou descrições, que são frases de uma linha. */
function Linhas({ rotulo, usos }: { rotulo: string; usos: Uso[] }) {
  if (usos.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {rotulo}
        {usos.length > 1 ? ` · ${usos.length}` : ''}
      </p>
      <ul className="mt-1.5 space-y-1">
        {usos.map((uso) => (
          <li key={uso.texto} className="flex items-baseline gap-2 text-sm">
            <span className="text-muted-foreground/50">·</span>
            <span>{uso.texto}</span>
            {uso.anuncios > 1 ? (
              <span className="shrink-0 text-xs text-muted-foreground">({uso.anuncios})</span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * O que os anúncios estão dizendo agora.
 *
 * O resto do Cérebro descreve o que cada campanha DEVERIA fazer; esta aba
 * mostra o que ela fala de fato. A distância entre as duas é o que se vem
 * procurar aqui — e o único jeito de encontrá-la é ter as duas na mesma tela.
 *
 * Os textos vêm de um arquivo gerado por `scripts/atualiza-criativos.mjs`, e
 * não de uma chamada ao vivo: ler 264 anúncios com o criativo inteiro leva seis
 * páginas de API, e ninguém deveria esperar por isso ao abrir uma tela.
 */
export function AnunciosNoAr() {
  const { criativos, campanhas, defeitos, lidoEm } = useMemo(() => {
    const criativos = (arquivo.anuncios as AnuncioBruto[]).map(lerCriativo);
    return {
      criativos,
      campanhas: agruparPorCampanha(criativos).filter((c) => c.ativos > 0),
      defeitos: defeitosDosCriativos(criativos),
      lidoEm: new Date(arquivo.lido_em),
    };
  }, []);

  const noAr = criativos.filter((c) => c.ativo).length;

  return (
    <div className="space-y-4">
      <Card className="border-primary/30 bg-primary/[0.03]">
        <CardContent className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 pt-6">
          <p className="text-sm leading-relaxed">
            <strong className="font-heading text-base">{noAr}</strong> anúncios no ar, de{' '}
            {criativos.length} na conta, em {campanhas.length} campanhas. O texto de cada um está
            abaixo, do que mais tem peça no ar para o que menos tem.
          </p>
          <p className="text-xs text-muted-foreground">
            Lido em {lidoEm.toLocaleDateString('pt-BR')} ·{' '}
            <code className="rounded bg-muted px-1 py-0.5">
              node scripts/atualiza-criativos.mjs
            </code>{' '}
            atualiza
          </p>
        </CardContent>
      </Card>

      {defeitos.length > 0 ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {defeitos.length === 1
              ? '1 anúncio no ar com defeito no texto'
              : `${defeitos.length} anúncios no ar com defeito no texto`}
          </AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-2">
              {defeitos.map((defeito) => (
                <li key={`${defeito.anuncioId}-${defeito.tipo}`}>
                  <span className="font-medium">{defeito.anuncio}</span>
                  <span className="text-xs opacity-70"> · {defeito.campanha}</span>
                  <p className="mt-0.5 text-sm opacity-90">{defeito.detalhe}</p>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      {campanhas.map((campanha) => (
        <Card key={campanha.campanha}>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquareText className="h-4 w-4 shrink-0 text-primary" />
                {campanha.campanha}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                {campanha.ctas.map((cta) => (
                  <Badge key={cta} variant="outline">
                    {BOTOES[cta] ?? cta}
                  </Badge>
                ))}
                <Badge variant="secondary" className="tabular-nums">
                  {campanha.ativos} no ar
                  {campanha.total > campanha.ativos ? ` · ${campanha.total} na conta` : ''}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {campanha.textos.map((uso) => (
                <Texto key={uso.texto} uso={uso} total={campanha.textos.length} />
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Linhas rotulo="Títulos" usos={campanha.titulos} />
              <Linhas rotulo="Descrições" usos={campanha.descricoes} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
