import { useMemo, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  Link2Off,
  Loader2,
} from 'lucide-react';
import { EIXOS, FONTES, FORMATOS, REGRAS, type Gravidade } from './dados/cerebro';
import { classificarFrente, interpretarCampanha, interpretarConjunto } from './lib/nomenclatura';
import { montarManual } from './lib/prompt-da-ia';
import { useCatalogoDeMidia } from './hooks/useLinhasDeMidia';
import { DivisorDaFaixa, FaixaDaMarca } from './components/FaixaDaMarca';
import { AnunciosNoAr } from './components/AnunciosNoAr';

const CORES_DA_GRAVIDADE: Record<Gravidade, string> = {
  alta: 'bg-destructive/10 text-destructive border-destructive/20',
  media: 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400',
  baixa: 'bg-muted text-muted-foreground border-border',
};

/**
 * O Cérebro: o manual que a IA lê antes de olhar qualquer número.
 *
 * A tela mostra três coisas lado a lado: o que a operação DEVERIA ser (o
 * manual), o que a conta REALMENTE tem (o catálogo do Meta) e onde as duas
 * discordam. Mostrar só o manual daria um documento bonito que ninguém
 * confere; mostrar só a conta daria uma lista sem critério.
 */
export default function Cerebro() {
  const { data: catalogo, isLoading, error } = useCatalogoDeMidia();
  const [copiado, setCopiado] = useState(false);

  const manual = useMemo(() => montarManual(), []);

  // Confronta o catálogo real com o manual: cada conjunto cai numa frente ou
  // não cai em nenhuma, e cada nome bate ou não com um formato declarado.
  const conferencia = useMemo(() => {
    if (!catalogo) return null;

    const nomeDaCampanha = new Map(catalogo.campanhas.map((c) => [c.id, c.nome]));

    const porFrente = new Map<string, number>();
    const foraDoManual = new Set<string>();
    const nomesTortos: Array<{ nome: string; onde: string }> = [];
    let semVinculo = 0;

    for (const conjunto of catalogo.conjuntos) {
      const campanha = conjunto.campaign_id
        ? nomeDaCampanha.get(conjunto.campaign_id) ?? ''
        : '';
      const { frenteId } = classificarFrente(campanha, conjunto.nome);

      if (frenteId) porFrente.set(frenteId, (porFrente.get(frenteId) ?? 0) + 1);
      else if (campanha) foraDoManual.add(campanha);

      if (interpretarConjunto(conjunto.nome).formato === null) {
        nomesTortos.push({ nome: conjunto.nome, onde: 'conjunto' });
      }
      if (!conjunto.vinculado) semVinculo += 1;
    }

    for (const campanha of catalogo.campanhas) {
      const lido = interpretarCampanha(campanha.nome);
      if (!lido.noPadrao) nomesTortos.push({ nome: campanha.nome, onde: 'campanha' });
    }

    return {
      porFrente,
      foraDoManual: [...foraDoManual].sort(),
      nomesTortos,
      semVinculo,
      totalConjuntos: catalogo.conjuntos.length,
      totalCampanhas: catalogo.campanhas.length,
    };
  }, [catalogo]);

  const copiarManual = async () => {
    await navigator.clipboard.writeText(manual);
    setCopiado(true);
    toast({ title: 'Manual copiado', description: 'Cole numa IA para dar o contexto das campanhas.' });
    setTimeout(() => setCopiado(false), 2500);
  };

  const baixarManual = () => {
    const blob = new Blob([manual], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cerebro-campanhas-pure-pilates.md';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <FaixaDaMarca
          sobretitulo="Mídia paga · Pure Pilates"
          titulo="Cérebro das campanhas"
          descricao="O manual de Meta e Google Ads que a IA lê antes de olhar qualquer número. Descreve o que cada campanha existe para fazer, como os nomes são construídos e o que cada fonte de dados responde."
          acoes={
            <>
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/15 text-white hover:bg-white/25"
                onClick={baixarManual}
              >
                <Download className="mr-2 h-4 w-4" />
                Baixar .md
              </Button>
              <Button size="sm" variant="secondary" className="text-primary" onClick={copiarManual}>
                {copiado ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                Copiar para a IA
              </Button>
            </>
          }
        >
          <DivisorDaFaixa />
          {/* Os três eixos como tese da página: em uma linha, quem abre já sabe
              o que o manual cobre antes de rolar. */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {EIXOS.map((eixo, i) => (
              <span key={eixo.id} className="flex items-center gap-3">
                {i > 0 ? <span className="text-white/30">·</span> : null}
                <span className="font-heading text-sm font-semibold">{eixo.nome}</span>
                <span className="text-xs text-white/60">
                  {eixo.frentes.map((f) => f.nome).join(', ')}
                </span>
              </span>
            ))}
          </div>
        </FaixaDaMarca>

        {error ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Não foi possível ler o catálogo do Meta</AlertTitle>
            <AlertDescription>
              O manual abaixo continua válido — ele não depende do banco. O que falta é a coluna
              que compara o manual com a conta. {String((error as Error).message)}
            </AlertDescription>
          </Alert>
        ) : null}

        <Card className="border-primary/30 bg-primary/[0.03]">
          <CardContent className="grid gap-4 pt-6 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Para que serve
              </p>
              <p className="mt-1 text-sm leading-relaxed">
                Descrever, num lugar só, o que cada campanha de Meta e Google Ads existe para
                fazer. É o contexto que a IA lê antes de olhar qualquer número — sem ele, ela
                compara um lead de RH com uma assinatura vendida.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Como usar
              </p>
              <p className="mt-1 text-sm leading-relaxed">
                Leia a aba <strong>Manual</strong> para entender a operação e a aba{' '}
                <strong>Manual × conta</strong> para ver onde a conta real discorda dele. O botão
                “Copiar para a IA” entrega o manual inteiro em texto.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Como mudar
              </p>
              <p className="mt-1 text-sm leading-relaxed">
                Mudou a operação? Um arquivo só —{' '}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">dados/cerebro.ts</code>. A
                tela, o prompt da IA e as verificações automáticas saem todos dele e mudam juntos.
              </p>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="manual" className="space-y-4">
          <TabsList>
            <TabsTrigger value="manual">Manual</TabsTrigger>
            <TabsTrigger value="conta">Manual × conta</TabsTrigger>
            <TabsTrigger value="anuncios">Anúncios no ar</TabsTrigger>
            <TabsTrigger value="nomes">Como nomear</TabsTrigger>
            <TabsTrigger value="fontes">Fontes de dados</TabsTrigger>
            <TabsTrigger value="regras">O que é conferido</TabsTrigger>
          </TabsList>

          {/* ---------------------------------------------------------------- */}
          <TabsContent value="manual" className="space-y-6">
            {EIXOS.map((eixo) => (
              <Card key={eixo.id} className="overflow-hidden">
                <div className="h-1 w-full" style={{ background: 'var(--gradient-primary)' }} />
                <CardHeader>
                  <CardTitle className="font-heading text-xl font-bold tracking-tight">
                    {eixo.nome}
                  </CardTitle>
                  <CardDescription className="max-w-3xl text-[15px] leading-relaxed">
                    {eixo.proposito}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 lg:grid-cols-2">
                  {eixo.frentes.map((frente) => (
                    <div
                      key={frente.id}
                      className="rounded-xl border bg-card p-5 transition-shadow hover:shadow-[var(--shadow-pure)]"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-heading text-base font-bold tracking-tight">
                          {frente.nome}
                        </h3>
                        {frente.plataformas.map((p) => (
                          <Badge key={p} variant="secondary" className="text-[11px]">
                            {p === 'meta' ? 'Meta' : p === 'google-ads' ? 'Google Ads' : 'GA4'}
                          </Badge>
                        ))}
                        {frente.exigeUnidade ? (
                          <Badge variant="outline" className="text-[11px]">
                            por unidade
                          </Badge>
                        ) : null}
                      </div>

                      <p className="mt-2 text-sm text-muted-foreground">{frente.objetivo}</p>

                      <dl className="mt-3 grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-[10rem,1fr]">
                        <dt className="text-muted-foreground">Para quem anuncia</dt>
                        <dd>{frente.publico}</dd>
                        <dt className="text-muted-foreground">O que conta como resultado</dt>
                        <dd>{frente.resultado}</dd>
                        <dt className="text-muted-foreground">Como se mede</dt>
                        <dd>
                          {frente.kpi === 'cpa'
                            ? 'CPA — custo por aquisição'
                            : frente.kpi === 'cpl'
                              ? 'CPL — custo por lead'
                              : frente.kpi.toUpperCase()}
                        </dd>
                        <dt className="text-muted-foreground">Quem responde</dt>
                        <dd className="capitalize">{frente.responsavel}</dd>
                        <dt className="text-muted-foreground">Meta da sede</dt>
                        <dd>
                          {frente.faixa ? (
                            `bom até ${frente.faixa.bom}`
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400">
                              ainda não definida — a análise compara com a mediana da própria frente
                            </span>
                          )}
                        </dd>
                      </dl>

                      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Regras de operação
                      </p>
                      <ul className="mt-1 space-y-1 text-sm">
                        {frente.regras.map((regra) => (
                          <li key={regra} className="flex gap-2">
                            <span className="text-primary">·</span>
                            <span>{regra}</span>
                          </li>
                        ))}
                      </ul>

                      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        O que costuma dar errado
                      </p>
                      <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                        {frente.errosComuns.map((erro) => (
                          <li key={erro} className="flex gap-2">
                            <span>·</span>
                            <span>{erro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* ---------------------------------------------------------------- */}
          <TabsContent value="conta" className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : conferencia ? (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Campanhas na conta</CardDescription>
                      <CardTitle className="text-3xl">{conferencia.totalCampanhas}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Conjuntos na conta</CardDescription>
                      <CardTitle className="text-3xl">{conferencia.totalConjuntos}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card className={conferencia.semVinculo > 0 ? 'border-destructive/40' : undefined}>
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-1.5">
                        <Link2Off className="h-3.5 w-3.5" />
                        Sem unidade vinculada
                      </CardDescription>
                      <CardTitle className="text-3xl">{conferencia.semVinculo}</CardTitle>
                    </CardHeader>
                  </Card>
                </div>

                {conferencia.semVinculo > 0 ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>O vínculo com a unidade é o que traz o número para o Hub</AlertTitle>
                    <AlertDescription>
                      A carga de métricas do Meta só busca conjunto vinculado a uma unidade. Os{' '}
                      {conferencia.semVinculo} conjuntos sem vínculo existem no catálogo e não têm
                      uma única linha de gasto aqui dentro — por isso frentes inteiras aparecem
                      como “sem dado” na análise. O vínculo é feito em Minha Área › Mídia adicional.
                    </AlertDescription>
                  </Alert>
                ) : null}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Conjuntos por frente do manual</CardTitle>
                    <CardDescription>
                      Contagem do catálogo inteiro, com ou sem gasto no período.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Eixo</TableHead>
                          <TableHead>Frente</TableHead>
                          <TableHead className="text-right">Conjuntos</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {EIXOS.flatMap((eixo) =>
                          eixo.frentes.map((frente) => (
                            <TableRow key={frente.id}>
                              <TableCell className="text-muted-foreground">{eixo.nome}</TableCell>
                              <TableCell className="font-medium">{frente.nome}</TableCell>
                              <TableCell className="text-right tabular-nums">
                                {conferencia.porFrente.get(frente.id) ?? (
                                  <span className="text-muted-foreground">0</span>
                                )}
                              </TableCell>
                            </TableRow>
                          )),
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {conferencia.foraDoManual.length > 0 ? (
                  <Card className="border-amber-500/40">
                    <CardHeader>
                      <CardTitle className="text-base">
                        Campanhas que o manual não cobre ({conferencia.foraDoManual.length})
                      </CardTitle>
                      <CardDescription>
                        Elas existem na conta e não se encaixam em nenhuma frente. Isso é uma
                        decisão em aberto — incluir no manual ou desligar —, não um erro do sistema.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1 font-mono text-sm">
                        {conferencia.foraDoManual.map((nome) => (
                          <li key={nome}>{nome}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ) : null}

                {conferencia.nomesTortos.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Nomes fora dos formatos ({conferencia.nomesTortos.length})
                      </CardTitle>
                      <CardDescription>
                        Nome que não casa com nenhum formato não entra em nenhum agrupamento do
                        relatório.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="max-h-80 overflow-auto">
                      <ul className="space-y-1 font-mono text-sm">
                        {conferencia.nomesTortos.map((item, i) => (
                          <li key={`${item.nome}-${i}`} className="flex gap-2">
                            <Badge variant="outline" className="shrink-0 text-[10px]">
                              {item.onde}
                            </Badge>
                            <span className="break-all">{item.nome}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ) : null}
              </>
            ) : null}
          </TabsContent>

          {/* ---------------------------------------------------------------- */}
          <TabsContent value="anuncios">
            <AnunciosNoAr />
          </TabsContent>

          {/* ---------------------------------------------------------------- */}
          <TabsContent value="nomes">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Formatos de nome em uso</CardTitle>
                <CardDescription>
                  Não é um ideal: é o que existe na conta hoje. O que não casar com nenhum destes
                  formatos aparece na aba “Manual × conta”.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {FORMATOS.map((formato) => (
                  <div key={formato.id} className="rounded-lg border p-4">
                    <Badge variant="secondary" className="mb-2 capitalize">
                      {formato.onde}
                    </Badge>
                    <p className="font-mono text-sm font-medium">{formato.modelo}</p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">{formato.exemplo}</p>
                    <p className="mt-2 text-sm">{formato.explicacao}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------------------------------------------------------------- */}
          <TabsContent value="fontes" className="space-y-4">
            {FONTES.map((fonte) => (
              <Card key={fonte.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{fonte.nome}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">Responde: </span>
                    {fonte.responde}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Não responde: </span>
                    {fonte.naoResponde}
                  </p>
                  <p>
                    <span className="text-muted-foreground">No Hub: </span>
                    {fonte.ondeMora}
                  </p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* ---------------------------------------------------------------- */}
          <TabsContent value="regras">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">O que é conferido automaticamente</CardTitle>
                <CardDescription>
                  Estas verificações rodam a cada análise, antes da IA. Ela recebe os achados
                  prontos — não depende de o modelo ter reparado.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {REGRAS.map((regra) => (
                  <div key={regra.id} className="rounded-lg border p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium">{regra.titulo}</h3>
                      <Badge variant="outline" className={CORES_DA_GRAVIDADE[regra.gravidade]}>
                        {regra.gravidade}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{regra.porque}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
