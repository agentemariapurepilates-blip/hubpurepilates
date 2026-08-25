import { useMemo, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
  ChevronDown,
  Copy,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { diagnosticar, type Achado } from './lib/analise';
import { montarRelatorio, porExtenso, type SecaoDoRelatorio } from './lib/resumo';
import { montarPrompt } from './lib/prompt-da-ia';
import { useDesempenhoDeMidia } from './hooks/useDesempenhoDeMidia';
import { useAcessoAMidia } from './hooks/useAcessoAMidia';
import { DivisorDaFaixa, FaixaDaMarca, NumeroDaFaixa } from './components/FaixaDaMarca';
import { FontesConsideradas } from './components/FontesConsideradas';
import { atalhos, SeletorDePeriodo, type Periodo } from './components/SeletorDePeriodo';

const real = (valor: number) =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const inteiro = (valor: number) => valor.toLocaleString('pt-BR', { maximumFractionDigits: 0 });

const CORES_DA_GRAVIDADE = {
  alta: 'border-destructive/30 bg-destructive/5',
  media: 'border-amber-500/30 bg-amber-500/5',
  baixa: 'border-border bg-muted/30',
} as const;

const ROTULO_DA_GRAVIDADE = {
  alta: 'Resolver agora',
  media: 'Olhar esta semana',
  baixa: 'Anotar',
} as const;

/**
 * Relatório de mídia paga.
 *
 * A tela é um relatório, e não um painel: quatro seções numeradas que respondem
 * quatro perguntas, na ordem em que uma pessoa precisa delas. Os números crus
 * ficam no fim, recolhidos — quem precisa deles sabe onde procurar; quem só
 * quer entender o período não deveria ter que atravessar duas tabelas antes de
 * chegar à conclusão.
 *
 * As quatro seções são escritas por `lib/resumo.ts`, sem IA. A IA escreve a
 * versão dela na última seção, a partir do mesmo material.
 */
export default function AnaliseDeMidia() {
  const [periodo, setPeriodo] = useState<Periodo>(() => atalhos()[3].periodo);
  const { data: linhas, isLoading, error } = useDesempenhoDeMidia(periodo.de, periodo.ate);
  const { data: acesso } = useAcessoAMidia();

  const [analise, setAnalise] = useState<string | null>(null);
  const [gerando, setGerando] = useState(false);
  const [falhaDaIa, setFalhaDaIa] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  // Sai do dado que de fato chegou, e não de uma lista escrita à mão: uma
  // fonte que parar de carregar cai sozinha daqui, em vez de continuar
  // anunciada como conectada enquanto entrega zero.
  //
  // O GA4 nunca entra: ele não produz linha de mídia. Está no manual como
  // fonte prevista, e o relatório diz o que fica sem resposta sem ele.
  const fontesConectadas = useMemo(
    () =>
      (linhas ?? [])
        .filter((l) => l.gasto > 0)
        .map((l) => l.plataforma)
        .filter((p, i, todas) => todas.indexOf(p) === i),
    [linhas],
  );

  const diagnostico = useMemo(() => {
    if (!linhas) return null;
    return diagnosticar(linhas, { de: periodo.de, ate: periodo.ate, fontesConectadas });
  }, [linhas, periodo.de, periodo.ate, fontesConectadas]);

  const secoes = useMemo(() => (diagnostico ? montarRelatorio(diagnostico) : []), [diagnostico]);

  const prompt = useMemo(
    () => (diagnostico && linhas ? montarPrompt(diagnostico, linhas) : ''),
    [diagnostico, linhas],
  );

  const gerarAnalise = async () => {
    if (!prompt) return;
    setGerando(true);
    setFalhaDaIa(null);
    try {
      const { data, error: erroDaFuncao } = await supabase.functions.invoke('midia-analise-ia', {
        body: { prompt },
      });
      if (erroDaFuncao) throw erroDaFuncao;
      const texto = (data as { texto?: string } | null)?.texto;
      if (!texto) throw new Error('A função respondeu sem texto.');
      setAnalise(texto);
    } catch (e) {
      // A função de borda ainda não está publicada (tudo local, por enquanto).
      // Em vez de esconder isso atrás de "erro inesperado", a tela diz o que
      // aconteceu e oferece o caminho que funciona hoje: copiar o prompt.
      setFalhaDaIa(e instanceof Error ? e.message : String(e));
    } finally {
      setGerando(false);
    }
  };

  const copiarPrompt = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopiado(true);
    toast({
      title: 'Prompt copiado',
      description: 'Manual, dados do período e a tarefa. Cole em qualquer IA.',
    });
    setTimeout(() => setCopiado(false), 2500);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <FaixaDaMarca
          sobretitulo="Mídia paga · Pure Pilates"
          titulo="Relatório de mídia paga"
          descricao="Quanto foi investido, o que voltou e o que precisa de decisão — considerando Meta, Google Ads e Google Analytics."
          acoes={
            <Button
              size="sm"
              variant="secondary"
              className="bg-white/15 text-white hover:bg-white/25"
              onClick={copiarPrompt}
              disabled={!prompt}
            >
              {copiado ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              Copiar prompt
            </Button>
          }
        >
          {diagnostico ? (
            <>
              <DivisorDaFaixa />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
                  {porExtenso(diagnostico.periodo.de)} a {porExtenso(diagnostico.periodo.ate)}
                </p>
                <div className="mt-3 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  <NumeroDaFaixa valor={real(diagnostico.totais.gasto)} rotulo="Investimento" />
                  <NumeroDaFaixa
                    valor={inteiro(diagnostico.totais.resultados)}
                    rotulo="Resultados"
                  />
                  <NumeroDaFaixa
                    valor={
                      diagnostico.totais.custoPorResultado === null
                        ? '—'
                        : real(diagnostico.totais.custoPorResultado)
                    }
                    rotulo="Custo por resultado"
                    nota={
                      diagnostico.totais.custoPorResultado === null
                        ? 'nenhum resultado no período'
                        : 'média entre frentes que compram coisas diferentes'
                    }
                  />
                  <NumeroDaFaixa
                    valor={inteiro(diagnostico.totais.conjuntos)}
                    rotulo="Conjuntos com dado"
                    nota={`${inteiro(diagnostico.totais.impressoes)} impressões`}
                  />
                </div>
              </div>

              {/* A ressalva fica DENTRO da faixa, colada nos números. Se
                  estivesse só no cartão de baixo, o total já teria sido lido
                  como total da rede antes de a pessoa chegar nela. */}
              {diagnostico.fontes.some((f) => !f.conectada) ? (
                <p className="rounded-lg bg-black/15 px-3 py-2 text-xs leading-relaxed text-white/85">
                  Números apurados com{' '}
                  {diagnostico.fontes.filter((f) => f.conectada).length} de{' '}
                  {diagnostico.fontes.length} fontes. Fora da conta:{' '}
                  {diagnostico.fontes
                    .filter((f) => !f.conectada)
                    .map((f) => f.nome)
                    .join(' e ')}
                  .
                </p>
              ) : null}
            </>
          ) : null}
        </FaixaDaMarca>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Período do relatório
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SeletorDePeriodo periodo={periodo} aoMudar={setPeriodo} />
          </CardContent>
        </Card>

        {error ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Não foi possível ler as métricas</AlertTitle>
            <AlertDescription>{String((error as Error).message)}</AlertDescription>
          </Alert>
        ) : null}

        {acesso && !acesso.completo ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Você está vendo um recorte, não a rede inteira</AlertTitle>
            <AlertDescription>
              Sua conta abre esta tela, mas não tem acesso de administrador no módulo de mídia. A
              segurança do banco devolve apenas os conjuntos das unidades atribuídas a você — os
              totais abaixo são desse recorte, e não da conta toda. Peça a liberação antes de usar
              estes números em qualquer decisão.
            </AlertDescription>
          </Alert>
        ) : null}

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : diagnostico && linhas ? (
          <>
            {/* --- as três fontes, antes de qualquer número ----------------- */}
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Fontes consideradas
              </h2>
              <FontesConsideradas fontes={diagnostico.fontes} />
            </section>

            {/* --- o relatório em quatro seções ---------------------------- */}
            {secoes.map((secao) => (
              <Secao key={secao.numero} secao={secao}>
                {secao.numero === 2 && diagnostico.achados.length > 0 ? (
                  <div className="mt-5 space-y-3">
                    {diagnostico.achados.map((achado, i) => (
                      <ItemDeAchado key={i} achado={achado} />
                    ))}
                  </div>
                ) : null}
              </Secao>
            ))}

            {/* --- análise da IA ------------------------------------------- */}
            <Card className="overflow-hidden">
              <div className="h-1 w-full" style={{ background: 'var(--gradient-primary)' }} />
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">A leitura da IA</CardTitle>
                    <CardDescription className="max-w-2xl">
                      As quatro seções acima são conta, e saem sempre iguais. A IA recebe o mesmo
                      material — o manual do Cérebro, os números do período e os pontos
                      encontrados — e escreve a versão dela, priorizando e ligando o que a conta
                      sozinha não liga.
                    </CardDescription>
                  </div>
                  <Button onClick={gerarAnalise} disabled={gerando || !prompt}>
                    {gerando ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Gerar leitura
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {falhaDaIa ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>A função de análise ainda não está publicada</AlertTitle>
                    <AlertDescription className="space-y-2">
                      <p>
                        O código dela está no repositório em{' '}
                        <code className="rounded bg-muted px-1 py-0.5 text-xs">
                          supabase/functions/midia-analise-ia
                        </code>
                        , sem deploy. Enquanto isso, o botão “Copiar prompt” lá em cima entrega o
                        texto inteiro — manual, dados e tarefa — para colar em qualquer IA.
                      </p>
                      <p className="text-xs text-muted-foreground">Detalhe técnico: {falhaDaIa}</p>
                    </AlertDescription>
                  </Alert>
                ) : analise ? (
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">{analise}</div>
                ) : (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    O prompt já está montado, com {inteiro(prompt.length)} caracteres. Gere aqui ou
                    copie e cole onde preferir.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* --- números crus, recolhidos -------------------------------- */}
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span>
                    Ver os números por frente e por conjunto ({inteiro(diagnostico.totais.conjuntos)}{' '}
                    conjuntos)
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Por frente do manual</CardTitle>
                    <CardDescription>
                      Cada frente compra uma coisa diferente. Comparar o custo entre linhas só faz
                      sentido dentro da mesma frente.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Eixo</TableHead>
                          <TableHead>Frente</TableHead>
                          <TableHead className="text-right">Conjuntos</TableHead>
                          <TableHead className="text-right">Investimento</TableHead>
                          <TableHead className="text-right">Resultados</TableHead>
                          <TableHead className="text-right">Custo/result.</TableHead>
                          <TableHead className="text-right">Mediana</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {diagnostico.porFrente.map((frente) => (
                          <TableRow
                            key={frente.frenteId}
                            className={frente.semDado ? 'opacity-60' : ''}
                          >
                            <TableCell className="text-muted-foreground">
                              {frente.eixoNome}
                            </TableCell>
                            <TableCell className="font-medium">{frente.frenteNome}</TableCell>
                            {frente.semDado ? (
                              <TableCell colSpan={5} className="text-sm text-muted-foreground">
                                sem dado no período
                              </TableCell>
                            ) : (
                              <>
                                <TableCell className="text-right tabular-nums">
                                  {frente.conjuntos}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                  {real(frente.gasto)}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                  {inteiro(frente.resultados)}
                                </TableCell>
                                <TableCell className="text-right font-medium tabular-nums">
                                  {frente.custoPorResultado === null
                                    ? '—'
                                    : real(frente.custoPorResultado)}
                                </TableCell>
                                <TableCell className="text-right tabular-nums text-muted-foreground">
                                  {frente.medianaDoCusto === null
                                    ? '—'
                                    : real(frente.medianaDoCusto)}
                                </TableCell>
                              </>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {diagnostico.foraDoManual.length > 0 ? (
                  <Card className="border-amber-500/40">
                    <CardHeader>
                      <CardTitle className="text-base">
                        Campanhas com gasto que o manual não cobre
                      </CardTitle>
                      <CardDescription>
                        Não entram em nenhuma frente e por isso não aparecem na tabela acima.
                        Decidir: incluir no Cérebro ou desligar.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1 font-mono text-sm">
                        {diagnostico.foraDoManual.map((nome) => (
                          <li key={nome}>{nome}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ) : null}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Conjuntos do período</CardTitle>
                    <CardDescription>Do que mais gastou para o que menos gastou.</CardDescription>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Conjunto</TableHead>
                          <TableHead>Unidade</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Investimento</TableHead>
                          <TableHead className="text-right">Result.</TableHead>
                          <TableHead className="text-right">Custo/result.</TableHead>
                          <TableHead className="text-right">Dias</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {linhas.map((linha) => (
                          <TableRow key={linha.conjuntoId}>
                            <TableCell className="max-w-[22rem] truncate font-mono text-xs">
                              {linha.conjunto}
                            </TableCell>
                            <TableCell className="text-sm">
                              {linha.unidadeVinculada?.nome ?? (
                                <Badge
                                  variant="outline"
                                  className="border-destructive/30 text-destructive"
                                >
                                  sem vínculo
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {linha.status ?? '—'}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {real(linha.gasto)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {inteiro(linha.resultados)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {linha.resultados > 0 ? real(linha.gasto / linha.resultados) : '—'}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-muted-foreground">
                              {linha.dias}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          </>
        ) : null}
      </div>
    </MainLayout>
  );
}

function Secao({ secao, children }: { secao: SecaoDoRelatorio; children?: React.ReactNode }) {
  return (
    <Card className="overflow-hidden">
      {/* Fio vermelho no topo: liga visualmente cada seção à faixa da marca
          sem repetir o vermelho cheio, que cansaria em quatro cartões. */}
      <div className="h-1 w-full" style={{ background: 'var(--gradient-primary)' }} />
      <CardContent className="pt-6">
        <div className="flex gap-4">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-heading text-sm font-bold text-primary-foreground"
            style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-pure)' }}
          >
            {secao.numero}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-heading text-lg font-bold tracking-tight">{secao.titulo}</h2>
            <p className="text-sm text-muted-foreground">{secao.pergunta}</p>

            <div className="mt-4 space-y-3">
              {secao.paragrafos.map((paragrafo, i) => (
                <p key={i} className="text-[15px] leading-relaxed">
                  {paragrafo}
                </p>
              ))}
            </div>

            {children}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ItemDeAchado({ achado }: { achado: Achado }) {
  return (
    <div className={`rounded-lg border p-4 ${CORES_DA_GRAVIDADE[achado.gravidade]}`}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="text-[11px]">
          {ROTULO_DA_GRAVIDADE[achado.gravidade]}
        </Badge>
        <span className="font-medium">{achado.titulo}</span>
      </div>
      <p
        className={
          achado.alvoTecnico
            ? 'mt-1 break-all font-mono text-xs text-muted-foreground'
            : 'mt-1 text-sm text-muted-foreground'
        }
      >
        {achado.alvo}
      </p>
      <p className="mt-2 text-sm leading-relaxed">{achado.detalhe}</p>
    </div>
  );
}
