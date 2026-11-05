import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, CheckCheck, ChevronLeft, ChevronRight, Loader2, Plus, Sparkles, Trash2, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { SugestaoDialog } from './SugestaoDialog';
import { AcoesDaSugestao, ListaDaEtapa, Miniatura } from './ListaDaEtapa';
import {
  COR_DA_MARCA,
  ETAPAS_DO_MES,
  MARCAS,
  STATUS,
  diasDoMes,
  diasPlanejaveis,
  hojeEmSaoPaulo,
  marcaDoDia,
  mesAtual,
  nomeDoMes,
  produzirAgora,
  rotuloDoDia,
  somarMeses,
  sugerirPautas,
  type ArtigoBlog,
  type ItemDoMes,
} from './blogTipos';

const EM_PRODUCAO = ['na_fila', 'gerando'];

/**
 * O planejamento do mês: um artigo por dia, revezando Studios, Academy e
 * Franchising. Daqui para a frente tudo é automático: o time gera as
 * sugestões, ajusta (edita, troca pelo Gemini ou exclui) e aprova o lote; o
 * servidor escreve o texto e faz a foto da capa de cada um (blog-produzir).
 * O que sobra para o time é aprovar os artigos prontos.
 *
 * Os contadores são clicáveis: cada um abre a lista daquela etapa.
 */
export function PlanejamentoMes() {
  const [mes, setMes] = useState(mesAtual());
  const [itens, setItens] = useState<ItemDoMes[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [aprovando, setAprovando] = useState(false);
  const [regenerando, setRegenerando] = useState<string | null>(null);
  const [etapa, setEtapa] = useState<string | null>(null);
  const [confirmarLote, setConfirmarLote] = useState(false);
  const [confirmarDescarte, setConfirmarDescarte] = useState(false);
  const [dialogo, setDialogo] = useState<{ aberto: boolean; sugestao?: ItemDoMes | null; dia?: string }>({ aberto: false });

  const dias = useMemo(() => diasDoMes(mes), [mes]);
  // O planejamento segue o calendário: só se planeja de hoje em diante.
  const hoje = hojeEmSaoPaulo();
  const planejaveis = useMemo(() => diasPlanejaveis(mes, hoje), [mes, hoje]);

  const carregar = useCallback(async () => {
    const { data, error } = await supabase
      .from('blog_artigos')
      .select(
        'id, status, marca, data_prevista, tema, palavra_chave, categoria, observacoes, titulo, erro_geracao, meta_descricao, conteudo_html, foto_url, capa_status, wp_post_id, wp_erro, wp_url, agendado_para, publicado_em',
      )
      .gte('data_prevista', dias[0])
      .lte('data_prevista', dias[dias.length - 1])
      .order('created_at');
    if (!error) setItens((data ?? []) as ItemDoMes[]);
    setCarregando(false);
  }, [dias]);

  useEffect(() => {
    setCarregando(true);
    carregar();
  }, [carregar]);

  // Enquanto o servidor estiver escrevendo ou fazendo foto, a tela se atualiza sozinha.
  const escrevendo = itens.some((i) => EM_PRODUCAO.includes(i.status));
  const fazendoFotos = itens.some((i) => i.capa_status === 'pendente' || i.capa_status === 'gerando');
  useEffect(() => {
    if (!escrevendo && !fazendoFotos) return;
    const t = setInterval(carregar, 15_000);
    return () => clearInterval(t);
  }, [escrevendo, fazendoFotos, carregar]);

  const porDia = useMemo(() => {
    const mapa = new Map<string, ItemDoMes[]>(dias.map((d) => [d, []]));
    for (const i of itens) if (i.data_prevista) mapa.get(i.data_prevista)?.push(i);
    return mapa;
  }, [itens, dias]);

  const sugestoes = itens.filter((i) => i.status === 'sugestao');
  const diasLivres = planejaveis.filter((d) => (porDia.get(d) ?? []).length === 0);
  // Dia que já passou só aparece se tiver artigo; vazio não tem mais o que fazer.
  const diasVisiveis = dias.filter((d) => d >= hoje || (porDia.get(d) ?? []).some((i) => i.status !== 'descartada'));
  const contar = (chave: string) => {
    const status = ETAPAS_DO_MES.find((e) => e.chave === chave)!.status;
    return itens.filter((i) => status.includes(i.status)).length;
  };
  const fotosFaltando = itens.filter((i) => i.capa_status === 'pendente' || i.capa_status === 'gerando').length;

  const gerarSugestoes = async () => {
    setGerando(true);
    try {
      const r = await sugerirPautas(mes);
      if (r.mensagem) toast.info(r.mensagem);
      else toast.success(`${r.sugestoes.length} sugestões criadas.${r.faltaram?.length ? ` ${r.faltaram.length} dias ficaram sem; clique de novo para completar.` : ''}`);
      await carregar();
    } catch (e) {
      toast.error(e instanceof Error ? `Não deu certo: ${e.message}.` : 'Não deu certo.');
    } finally {
      setGerando(false);
    }
  };

  // Excluir uma sugestão deixa o dia SEM POSTAGEM, e não livre: "Gerar
  // sugestões" pula esse dia. "Desfazer" libera o dia de novo.
  const excluirSugestao = async (id: string) => {
    const { error } = await supabase.from('blog_artigos').update({ status: 'descartada' }).eq('id', id).eq('status', 'sugestao');
    if (error) toast.error('Não consegui excluir.');
    else toast.success('Sugestão excluída. O dia fica sem postagem.');
    await carregar();
  };

  const desfazerDiaVazio = async (id: string) => {
    const { error } = await supabase.from('blog_artigos').delete().eq('id', id).eq('status', 'descartada');
    if (error) toast.error('Não consegui desfazer.');
    await carregar();
  };

  // Troca a ideia pelo Gemini no mesmo dia e na mesma marca. A nova é criada
  // antes de apagar a antiga, que entra na lista de temas a não repetir.
  const regenerar = async (i: ItemDoMes) => {
    if (!i.data_prevista) return;
    setRegenerando(i.id);
    try {
      const { sugestoes: novas } = await sugerirPautas(mes, { dias: [i.data_prevista], marca: i.marca });
      if (!novas.length) throw new Error('o Gemini não trouxe outra ideia');
      await supabase.from('blog_artigos').delete().eq('id', i.id).eq('status', 'sugestao');
      toast.success('Sugestão trocada.');
      await carregar();
    } catch (e) {
      toast.error(e instanceof Error ? `Não deu certo: ${e.message}.` : 'Não deu certo.');
    } finally {
      setRegenerando(null);
    }
  };

  // Descartar todas libera os dias (diferente de excluir uma a uma).
  const descartarTodas = async () => {
    const { error } = await supabase.from('blog_artigos').delete().in('id', sugestoes.map((s) => s.id)).eq('status', 'sugestao');
    if (error) toast.error('Não consegui descartar as sugestões.');
    else toast.success('Sugestões descartadas. Os dias ficaram livres para gerar de novo.');
    await carregar();
  };

  const aprovarLote = async () => {
    setAprovando(true);
    const { error } = await supabase
      .from('blog_artigos')
      .update({ status: 'na_fila', tentativas: 0, erro_geracao: null })
      .in('id', sugestoes.map((s) => s.id))
      .eq('status', 'sugestao');
    setAprovando(false);
    if (error) {
      toast.error('Não consegui enviar o lote para produção.');
      return;
    }
    toast.success(`${sugestoes.length} pautas foram para produção. Texto e capa saem sozinhos, e cada artigo pronto aparece em Para aprovar.`);
    await carregar();
    // Não espera: o primeiro artigo começa agora, e o cron segue com o resto.
    produzirAgora().catch(() => undefined);
  };

  const tentarDeNovo = async (id: string) => {
    await supabase.from('blog_artigos').update({ status: 'na_fila', tentativas: 0, erro_geracao: null }).eq('id', id);
    await carregar();
    produzirAgora().catch(() => undefined);
  };

  return (
    <div className="space-y-5">
      {/* Mês e ações */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setMes((m) => somarMeses(m, -1))} aria-label="Mês anterior">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <p className="min-w-[170px] text-center text-lg font-semibold text-foreground">{nomeDoMes(mes)}</p>
          <Button variant="outline" size="icon" onClick={() => setMes((m) => somarMeses(m, 1))} aria-label="Próximo mês">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={gerarSugestoes} disabled={gerando || carregando || diasLivres.length === 0}>
            {gerando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            {gerando ? 'Gerando, leva cerca de um minuto' : `Gerar sugestões${diasLivres.length ? ` (${diasLivres.length} dias)` : ''}`}
          </Button>
          <Button variant="outline" onClick={() => setDialogo({ aberto: true, sugestao: null })} disabled={!planejaveis.length}>
            <Plus className="h-4 w-4 mr-2" /> Acrescentar
          </Button>
          {sugestoes.length > 0 && (
            <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setConfirmarDescarte(true)}>
              <Trash2 className="h-4 w-4 mr-2" /> Descartar todas
            </Button>
          )}
          <Button onClick={() => setConfirmarLote(true)} disabled={!sugestoes.length || aprovando}>
            {aprovando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCheck className="h-4 w-4 mr-2" />}
            Aprovar todas e produzir ({sugestoes.length})
          </Button>
        </div>
      </div>

      {/* Contadores: cada um abre a lista da etapa. Clicar de novo volta ao calendário. */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {ETAPAS_DO_MES.map((e) => {
          const ativo = etapa === e.chave;
          return (
            <button
              key={e.chave}
              type="button"
              onClick={() => setEtapa(ativo ? null : e.chave)}
              className={cn(
                'rounded-xl border px-4 py-3 text-left transition-colors',
                ativo ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-card hover:border-primary/40',
              )}
            >
              <p className={cn('text-2xl font-bold tabular-nums', ativo ? 'text-primary' : 'text-foreground')}>{contar(e.chave)}</p>
              <p className="text-xs text-muted-foreground">{e.rotulo}</p>
            </button>
          );
        })}
      </div>
      {(escrevendo || fazendoFotos) && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {escrevendo
            ? 'O Gemini está escrevendo, um artigo por vez. A tela se atualiza sozinha.'
            : `O Gemini está fazendo as fotos das capas: faltam ${fotosFaltando}. A tela se atualiza sozinha.`}
        </p>
      )}

      {carregando ? (
        <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : etapa ? (
        <div className="space-y-2">
          <Button variant="ghost" size="sm" onClick={() => setEtapa(null)}>
            <CalendarDays className="h-4 w-4 mr-2" /> Ver o calendário do mês
          </Button>
          <ListaDaEtapa
            etapa={etapa}
            itens={itens}
            onMudou={carregar}
            onEditarSugestao={(i) => setDialogo({ aberto: true, sugestao: i })}
            onExcluirSugestao={excluirSugestao}
            onRegenerarSugestao={regenerar}
            regenerando={regenerando}
            onTentarDeNovo={tentarDeNovo}
          />
        </div>
      ) : diasVisiveis.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Esse mês já passou e não teve artigos planejados.
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {diasVisiveis.map((dia) => {
            const doDia = porDia.get(dia) ?? [];
            const marca = marcaDoDia(dia);
            const passou = dia < hoje;
            return (
              <li
                key={dia}
                className={cn(
                  'grid grid-cols-[92px_1fr] sm:grid-cols-[110px_1fr] gap-3 px-4 py-3',
                  passou && 'opacity-60',
                  dia === hoje && 'bg-primary/[0.04]',
                )}
              >
                <div className="pt-0.5">
                  <p className="text-sm font-medium text-foreground tabular-nums">
                    {rotuloDoDia(dia)}
                    {dia === hoje && <span className="ml-1.5 text-[11px] font-semibold uppercase text-primary">hoje</span>}
                  </p>
                  <span className={cn('mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium', COR_DA_MARCA[marca])}>
                    {MARCAS[marca].nome}
                  </span>
                </div>
                <div className="space-y-2 min-w-0">
                  {doDia.length === 0 && (
                    <button
                      type="button"
                      onClick={() => setDialogo({ aberto: true, sugestao: null, dia })}
                      className="text-sm text-muted-foreground hover:text-primary"
                    >
                      Sem pauta. Acrescentar
                    </button>
                  )}
                  {doDia.map((i) => {
                    if (i.status === 'descartada') {
                      return (
                        <div key={i.id} className="flex items-center justify-between gap-3">
                          <p className="text-sm text-muted-foreground italic">Sem postagem neste dia</p>
                          <Button variant="ghost" size="sm" className="h-8" onClick={() => desfazerDiaVazio(i.id)}>
                            <Undo2 className="h-3.5 w-3.5 mr-1.5" /> Desfazer
                          </Button>
                        </div>
                      );
                    }
                    if (i.status === 'sugestao') {
                      return (
                        <div key={i.id} className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground">
                              {i.marca !== marca && (
                                <span className={cn('mr-2 rounded-full px-2 py-0.5 text-[11px] font-medium', COR_DA_MARCA[i.marca])}>
                                  {MARCAS[i.marca].nome}
                                </span>
                              )}
                              {i.tema}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {[i.palavra_chave && `Palavra-chave: ${i.palavra_chave}`, i.categoria].filter(Boolean).join(' · ')}
                            </p>
                            {i.observacoes && <p className="text-xs text-muted-foreground mt-1">{i.observacoes}</p>}
                          </div>
                          <AcoesDaSugestao
                            ocupado={regenerando === i.id}
                            onEditar={() => setDialogo({ aberto: true, sugestao: i })}
                            onRegenerar={() => regenerar(i)}
                            onExcluir={() => excluirSugestao(i.id)}
                          />
                        </div>
                      );
                    }
                    return (
                      <div key={i.id} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Miniatura item={i} />
                          <Link to={`/marketing/blog/${i.id}`} className="min-w-0 text-sm font-semibold text-foreground hover:text-primary">
                            {i.titulo || i.tema}
                            {i.status === 'falhou' && i.erro_geracao && (
                              <span className="block text-xs font-normal text-destructive mt-0.5">{i.erro_geracao}</span>
                            )}
                          </Link>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {i.status === 'falhou' && (
                            <Button variant="outline" size="sm" className="h-7" onClick={() => tentarDeNovo(i.id)}>Tentar de novo</Button>
                          )}
                          <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', STATUS[i.status]?.classe)}>
                            {i.status === 'gerando' && <Loader2 className="inline h-3 w-3 animate-spin mr-1" />}
                            {STATUS[i.status]?.rotulo}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <SugestaoDialog
        mes={mes}
        aberto={dialogo.aberto}
        sugestao={dialogo.sugestao as ArtigoBlog | null | undefined}
        diaInicial={dialogo.dia}
        onFechar={() => setDialogo({ aberto: false })}
        onSalvo={carregar}
      />

      <AlertDialog open={confirmarLote} onOpenChange={setConfirmarLote}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Produzir as {sugestoes.length} pautas?</AlertDialogTitle>
            <AlertDialogDescription>
              Daqui em diante é automático: o Gemini escreve o texto e faz a foto da capa de cada artigo, um por vez. Os prontos
              aparecem em Para aprovar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={aprovarLote}>Aprovar e produzir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmarDescarte} onOpenChange={setConfirmarDescarte}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar as {sugestoes.length} sugestões?</AlertDialogTitle>
            <AlertDialogDescription>
              Só as sugestões saem, e os dias delas ficam livres para gerar de novo. Artigos em produção ou prontos continuam.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={descartarTodas}>Descartar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
