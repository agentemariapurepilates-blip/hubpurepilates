import { Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tv, Download, Video, MapPin, Smartphone, Info } from 'lucide-react';
import {
  DATA_DA_TABELA,
  EXEMPLOS_DO_PDF,
  GAMA,
  PRACAS_TV,
  milhares,
  pacoteCompleto,
  reais,
} from './dados-pracas';

// Página de apresentação da mídia local na TV Globo (menu Marketing). Os preços
// vêm de dados-pracas.ts (gerado da planilha da Globo, com testes que refazem as
// contas). O pedido em si é feito em /autorizar-midia-local.

// Imagem do card "Impacto Local" (material da Globo, entregue em 05/11/2026). Para trocar, salve
// em public/arquivos/midia-local/ e ajuste o caminho abaixo; null esconde a imagem, por exemplo
// '/arquivos/midia-local/impacto-local.png'. Enquanto for null, a página não
// mostra espaço vazio. (Não use import.meta.glob em public/: o Vite não deixa
// importar arquivo dessa pasta pelo JavaScript.)
const imagemImpacto: string | null = '/arquivos/midia-local/impacto-local.png';

const MarketingLocal = () => (
  <MainLayout>
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-heading font-bold flex items-center gap-2">
          <Tv className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          Marketing local · TV Globo
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Um comercial da sua unidade na TV Globo da sua praça, comprado por impacto e com custo previsível.
        </p>
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">Quer pedir agora?</p>
            <p className="text-sm text-muted-foreground">
              Preencha o pedido e a Rise, agência parceira, responde direto para você.
            </p>
          </div>
          <Button asChild size="lg" className="w-full sm:w-auto shrink-0">
            <Link to="/autorizar-midia-local">Pedir mídia local</Link>
          </Button>
        </CardContent>
      </Card>

      {imagemImpacto && (
        <img src={imagemImpacto} alt="Impacto Local, mídia local da TV Globo" className="w-full max-w-md mx-auto rounded-xl border border-foreground/10" />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-heading">Como funciona</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed text-foreground/85">
          <p>
            Seu comercial de <strong>10 ou 15 segundos</strong> vai ao ar na <strong>TV Globo da sua praça</strong>. A
            compra é por <strong>impacto</strong> (quantas vezes o comercial é visto), com <strong>CPM fixo</strong>: você
            sabe quanto custa cada mil impactos antes de fechar.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-foreground/10 p-4">
              <p className="font-semibold flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Telas da GAMA (opcional)</p>
              <p className="text-muted-foreground mt-1">
                Telas em prédios residenciais e shoppings, a partir de {reais(GAMA.dooh.investimento)} (cerca de{' '}
                {milhares(GAMA.dooh.impactosEstimados)} impactos estimados).
              </p>
            </div>
            <div className="rounded-lg border border-foreground/10 p-4">
              <p className="font-semibold flex items-center gap-2"><Smartphone className="h-4 w-4 text-primary" /> Anúncio no celular (opcional)</p>
              <p className="text-muted-foreground mt-1">
                Anúncio para quem passou perto das telas, por {reais(GAMA.geofence.investimento)} (cerca de{' '}
                {milhares(GAMA.geofence.impactos)} impactos).
              </p>
            </div>
          </div>
          <p>
            <strong>Near Live:</strong> comercial gravado com um talento local, dentro de programas da grade, por cerca de
            R$ 8 mil em 2 inserções.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-heading">Quanto custa em cada praça</CardTitle>
          <CardDescription>
            Tabela de {DATA_DA_TABELA}, investimento bruto negociado. "Pacote completo" soma a TV, as telas da GAMA e o
            anúncio no celular.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-foreground/10">
                  <th className="py-2 pr-3">Praça</th>
                  <th className="py-2 pr-3">Formato</th>
                  <th className="py-2 pr-3 text-right">Impactos</th>
                  <th className="py-2 pr-3 text-right">TV Globo</th>
                  <th className="py-2 text-right">Pacote completo</th>
                </tr>
              </thead>
              <tbody>
                {PRACAS_TV.map((p) => (
                  <tr key={p.cidade} className="border-b border-foreground/5">
                    <td className="py-2 pr-3 font-medium">{p.cidade}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{p.formato} · {p.periodo}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{milhares(p.impactos)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums font-semibold text-primary">{reais(p.investimento)}</td>
                    <td className="py-2 text-right tabular-nums">{reais(pacoteCompleto(p.investimento))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 flex items-start gap-3">
            <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-900 leading-relaxed">
              Valores sujeitos a reajuste pela data de veiculação e à disponibilidade de espaço. A Globo emite um PI por
              mês, o pagamento é feito à Globo em 15 dias fora o mês, o criativo precisa estar pronto 2 dias úteis antes
              de ir ao ar e a produção do comercial é responsabilidade do anunciante.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-heading">Exemplos de outras cidades</CardTitle>
          <CardDescription>Do material da Globo "Como conhecer os diferentes Brasis pode ajudar as Franquias".</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {EXEMPLOS_DO_PDF.map((e) => (
              <div key={e.cidade} className="rounded-lg border border-foreground/10 p-4 text-sm">
                <p className="font-heading font-semibold">{e.cidade} · {e.uf}</p>
                <p className="mt-2 text-muted-foreground">TV mais digital</p>
                <p className="font-semibold text-primary">{reais(e.tvMaisDigital.investimento)}</p>
                <p className="text-xs text-muted-foreground">{e.tvMaisDigital.impactos} impactos</p>
                <p className="mt-2 text-muted-foreground">Near Live</p>
                <p className="font-semibold text-primary">{reais(e.nearLive.investimento)}</p>
                <p className="text-xs text-muted-foreground">{e.nearLive.insercoes}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-heading">Materiais para baixar</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3">
          <Button asChild variant="outline">
            <a href="/arquivos/midia-local/diferentes-brasis-franquias.pdf" target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4 mr-2" />
              Como conhecer os diferentes Brasis (PDF)
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href="/arquivos/midia-local/gama-dooh-2026.pdf" target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4 mr-2" />
              Apresentação GAMA DOOH 2026 (PDF)
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <Video className="h-4 w-4 text-primary" />
            Vídeos de exemplo
          </CardTitle>
          <CardDescription>Em breve: exemplos de comerciais locais, pedidos à Globo.</CardDescription>
        </CardHeader>
      </Card>

      <div className="flex justify-center pb-4">
        <Button asChild size="lg">
          <Link to="/autorizar-midia-local">Pedir mídia local</Link>
        </Button>
      </div>
    </div>
  </MainLayout>
);

export default MarketingLocal;
