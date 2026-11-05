import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, Check, CheckCheck, ExternalLink, ImageIcon, Loader2, Pencil, RefreshCw, ShieldCheck, Sparkles, Trash2 } from 'lucide-react';
import { agendarArtigo, agendarVarios } from './agendarNoWordPress';
import { corrigirSeoComGemini } from './corrigirSeo';
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
import { useAuth } from '@/contexts/AuthContext';
import { COR_DA_MARCA, ETAPAS_DO_MES, MARCAS, STATUS, conferirArtigo, linkNoPainelWp, rotuloDoAgendamento, rotuloDoDia, type ItemDoMes } from './blogTipos';

export type { ItemDoMes } from './blogTipos';


/** O que ainda impede a aprovação (regras de SEO obrigatórias). Vazio é aprovável. */
const pendencias = (i: ItemDoMes) =>
  conferirArtigo({ titulo: i.titulo, meta_descricao: i.meta_descricao, conteudo_html: i.conteudo_html }, i.palavra_chave ?? '');

/** A miniatura da capa: a foto na pétala, ou o andamento dela. */
export function Miniatura({ item }: { item: ItemDoMes }) {
  const fazendo = item.capa_status === 'pendente' || item.capa_status === 'gerando';
  return (
    <div className="h-14 w-14 shrink-0 overflow-hidden bg-muted flex items-center justify-center" style={{ borderRadius: '28px 28px 28px 0' }}>
      {item.foto_url ? (
        <img src={item.foto_url} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : fazendo ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <ImageIcon className="h-4 w-4 text-muted-foreground" />
      )}
    </div>
  );
}

/** Editar à mão, pedir outra ao Gemini ou excluir (o dia fica sem postagem). */
export function AcoesDaSugestao({
  ocupado,
  onEditar,
  onRegenerar,
  onExcluir,
}: {
  ocupado: boolean;
  onEditar: () => void;
  onRegenerar: () => void;
  onExcluir: () => void;
}) {
  return (
    <div className="flex shrink-0">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEditar} disabled={ocupado} aria-label="Editar" title="Editar">
        <Pencil className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRegenerar} disabled={ocupado} aria-label="Gerar outra sugestão" title="Gerar outra sugestão">
        {ocupado ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive hover:text-destructive"
        onClick={onExcluir}
        disabled={ocupado}
        aria-label="Excluir (o dia fica sem postagem)"
        title="Excluir (o dia fica sem postagem)"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

/**
 * A lista de uma etapa do mês, aberta ao clicar no contador. Em "Para aprovar",
 * aprova um a um ou todos de uma vez, e cada aprovado vai sozinho para a agenda
 * do WordPress. Em "Aprovados" fica só o que não conseguiu ir (capa por fazer
 * ou erro), com o botão para agendar de novo.
 */
export function ListaDaEtapa({
  etapa,
  itens,
  onMudou,
  onEditarSugestao,
  onExcluirSugestao,
  onRegenerarSugestao,
  regenerando,
  onTentarDeNovo,
}: {
  etapa: string;
  itens: ItemDoMes[];
  onMudou: () => void;
  onEditarSugestao: (i: ItemDoMes) => void;
  onExcluirSugestao: (id: string) => void;
  onRegenerarSugestao: (i: ItemDoMes) => void;
  regenerando: string | null;
  onTentarDeNovo: (id: string) => void;
}) {
  const { user } = useAuth();
  const [aprovando, setAprovando] = useState<string | null>(null);
  const [confirmarTodos, setConfirmarTodos] = useState(false);
  // Aprovação manual: passa por cima das pendências de SEO, com confirmação.
  const [manual, setManual] = useState<ItemDoMes | null>(null);
  const definicao = ETAPAS_DO_MES.find((e) => e.chave === etapa)!;
  const lista = itens
    .filter((i) => definicao.status.includes(i.status))
    .sort((a, b) => (a.data_prevista ?? '').localeCompare(b.data_prevista ?? ''));

  const aprovaveis = etapa === 'aprovar' ? lista.filter((i) => pendencias(i).length === 0) : [];
  // Só vai para a agenda quem já tem a foto da capa.
  const comCapa = (i: ItemDoMes) => !!i.foto_url;
  const agendaveis = etapa === 'aprovados' ? lista.filter(comCapa) : [];

  /** Agenda e conta ao time como foi, com o andamento num aviso só. */
  const agendar = async (ids: string[]) => {
    if (!ids.length) return;
    const aviso = toast.loading(`Agendando no WordPress: 0 de ${ids.length}`);
    const { agendados, falhas } = await agendarVarios(ids, (feitos, total) =>
      toast.loading(`Agendando no WordPress: ${feitos} de ${total}`, { id: aviso }),
    );
    if (falhas.length) {
      toast.error(`${agendados} agendados. ${falhas.length} ficaram em Aprovados: ${falhas[0].motivo}.`, { id: aviso, duration: 8000 });
    } else {
      toast.success(`${agendados} ${agendados === 1 ? 'artigo agendado' : 'artigos agendados'} no WordPress.`, { id: aviso });
    }
    onMudou();
  };

  const aprovar = async (ids: string[], deOnde: string[] = ['em_aprovacao']) => {
    const { error } = await supabase
      .from('blog_artigos')
      .update({ status: 'aprovado', revisado_por: user?.id ?? null, revisado_em: new Date().toISOString() })
      .in('id', ids)
      .in('status', deOnde);
    if (error) throw new Error('não consegui aprovar');
  };

  const aprovarManualmente = async (item: ItemDoMes) => {
    setManual(null);
    setAprovando(item.id);
    try {
      await aprovar([item.id], ['rascunho', 'ajustes', 'em_aprovacao']);
      if (comCapa(item)) await agendar([item.id]);
      else toast.success('Aprovado. Ele vai para a agenda do WordPress quando a capa ficar pronta, em Aprovados.');
      onMudou();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Não consegui aprovar.');
    } finally {
      setAprovando(null);
    }
  };

  const aprovarUm = async (item: ItemDoMes) => {
    const faltando = pendencias(item);
    if (faltando.length) {
      toast.error(`Este artigo tem pendência de SEO: ${faltando[0]} Abra para resolver.`);
      return;
    }
    setAprovando(item.id);
    try {
      await aprovar([item.id]);
      if (comCapa(item)) await agendar([item.id]);
      else toast.success('Artigo aprovado. Ele vai para a agenda do WordPress quando a capa ficar pronta, em Aprovados.');
      onMudou();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Não consegui aprovar.');
    } finally {
      setAprovando(null);
    }
  };

  const corrigir = async (item: ItemDoMes) => {
    setAprovando(item.id);
    const aviso = toast.loading('O Gemini está corrigindo o SEO. Leva cerca de um minuto.');
    try {
      const resta = await corrigirSeoComGemini(item.id, user?.id);
      if (resta.length) toast.warning(`Melhorou, mas ainda falta: ${resta[0]} Abra para ajustar.`, { id: aviso, duration: 8000 });
      else toast.success('SEO corrigido. O artigo foi para Para aprovar.', { id: aviso });
    } catch (e) {
      toast.error(e instanceof Error ? `Não deu certo: ${e.message}.` : 'Não deu certo.', { id: aviso });
    } finally {
      setAprovando(null);
      onMudou();
    }
  };

  const agendarUm = async (item: ItemDoMes) => {
    setAprovando(item.id);
    try {
      await agendarArtigo(item.id);
      toast.success('Artigo agendado no WordPress.');
      onMudou();
    } catch (e) {
      toast.error(e instanceof Error ? `Não agendou: ${e.message}.` : 'Não agendou.');
      onMudou();
    } finally {
      setAprovando(null);
    }
  };

  const aprovarTodos = async () => {
    setAprovando('todos');
    try {
      await aprovar(aprovaveis.map((i) => i.id));
      const fora = lista.length - aprovaveis.length;
      if (fora) toast.info(`${fora} ficaram de fora por pendência de SEO; abra cada um para resolver.`);
      onMudou();
      await agendar(aprovaveis.filter(comCapa).map((i) => i.id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Não consegui aprovar.');
    } finally {
      setAprovando(null);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border px-4 py-3">
        <p className="font-semibold text-foreground">
          {definicao.rotulo} <span className="text-muted-foreground font-normal tabular-nums">({lista.length})</span>
        </p>
        {etapa === 'aprovados' && lista.length > 0 && (
          <Button
            onClick={async () => {
              setAprovando('todos');
              await agendar(agendaveis.map((i) => i.id));
              setAprovando(null);
            }}
            disabled={!agendaveis.length || aprovando !== null}
          >
            {aprovando === 'todos' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CalendarClock className="h-4 w-4 mr-2" />}
            Agendar todos no WordPress ({agendaveis.length})
          </Button>
        )}
        {etapa === 'aprovar' && lista.length > 0 && (
          <Button onClick={() => setConfirmarTodos(true)} disabled={!aprovaveis.length || aprovando !== null}>
            {aprovando === 'todos' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCheck className="h-4 w-4 mr-2" />}
            Aprovar todos ({aprovaveis.length})
          </Button>
        )}
      </div>

      {lista.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">Nenhum artigo nesta etapa.</p>
      ) : (
        <ul className="divide-y divide-border">
          {lista.map((i) => {
            const faltando = etapa === 'aprovar' || etapa === 'edicao' ? pendencias(i) : [];
            return (
              <li key={i.id} className="flex items-center gap-3 px-4 py-3">
                {i.status !== 'sugestao' && <Miniatura item={i} />}
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-1.5">
                    {i.data_prevista && <span className="tabular-nums">{rotuloDoDia(i.data_prevista)}</span>}
                    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', COR_DA_MARCA[i.marca])}>{MARCAS[i.marca]?.nome}</span>
                    {i.categoria && <span>{i.categoria}</span>}
                  </p>
                  {i.status === 'sugestao' ? (
                    <p className="text-sm font-semibold text-foreground mt-0.5">{i.tema}</p>
                  ) : (
                    <Link to={`/marketing/blog/${i.id}`} className="block text-sm font-semibold text-foreground hover:text-primary mt-0.5 truncate">
                      {i.titulo || i.tema}
                    </Link>
                  )}
                  {faltando.length > 0 && (
                    <p className="text-xs text-amber-700 mt-0.5">
                      SEO: {faltando[0]}
                      {faltando.length > 1 && ` E mais ${faltando.length - 1}.`}
                    </p>
                  )}
                  {i.status === 'falhou' && i.erro_geracao && <p className="text-xs text-destructive mt-0.5">{i.erro_geracao}</p>}
                  {i.status === 'aprovado' && i.wp_erro && <p className="text-xs text-destructive mt-0.5">WordPress: {i.wp_erro}</p>}
                  {i.status === 'aprovado' && !i.foto_url && <p className="text-xs text-muted-foreground mt-0.5">Esperando a capa ficar pronta.</p>}
                  {i.status === 'agendado' && i.agendado_para && (
                    <p className="text-xs text-sky-800 mt-0.5 flex items-center gap-1">
                      <CalendarClock className="h-3.5 w-3.5" /> Vai ao ar {rotuloDoAgendamento(i.agendado_para)}
                    </p>
                  )}
                  {i.status === 'agendado' && i.wp_erro && <p className="text-xs text-destructive mt-0.5">WordPress: {i.wp_erro}</p>}
                  {i.status === 'publicado' && (
                    <p className="text-xs text-emerald-800 mt-0.5 flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" /> Publicado {rotuloDoAgendamento(i.publicado_em ?? i.agendado_para ?? new Date().toISOString())}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  {i.status === 'sugestao' ? (
                    <AcoesDaSugestao
                      ocupado={regenerando === i.id}
                      onEditar={() => onEditarSugestao(i)}
                      onRegenerar={() => onRegenerarSugestao(i)}
                      onExcluir={() => onExcluirSugestao(i.id)}
                    />
                  ) : (
                    <>
                      {i.status === 'falhou' && (
                        <Button variant="outline" size="sm" className="h-8" onClick={() => onTentarDeNovo(i.id)}>Tentar de novo</Button>
                      )}
                      {etapa !== 'aprovar' && (
                        <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', STATUS[i.status]?.classe)}>
                          {i.status === 'gerando' && <Loader2 className="inline h-3 w-3 animate-spin mr-1" />}
                          {STATUS[i.status]?.rotulo}
                        </span>
                      )}
                      {!['na_fila', 'gerando'].includes(i.status) && (
                        <Button asChild variant="ghost" size="sm" className="h-8">
                          <Link to={`/marketing/blog/${i.id}`}><ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Abrir</Link>
                        </Button>
                      )}
                      {i.status === 'agendado' && i.wp_post_id && (
                        <Button asChild variant="ghost" size="sm" className="h-8">
                          <a href={linkNoPainelWp(i.wp_post_id)} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> WordPress
                          </a>
                        </Button>
                      )}
                      {i.status === 'publicado' && i.wp_url && (
                        <Button asChild variant="ghost" size="sm" className="h-8">
                          <a href={i.wp_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Ver no blog
                          </a>
                        </Button>
                      )}
                      {(etapa === 'edicao' || etapa === 'aprovar') && faltando.length > 0 && (
                        <Button size="sm" variant="secondary" className="h-8" onClick={() => corrigir(i)} disabled={aprovando !== null}>
                          {aprovando === i.id ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
                          Corrigir com o Gemini
                        </Button>
                      )}
                      {(etapa === 'edicao' || (etapa === 'aprovar' && faltando.length > 0)) && (
                        <Button size="sm" variant="outline" className="h-8" onClick={() => setManual(i)} disabled={aprovando !== null}>
                          <ShieldCheck className="h-3.5 w-3.5 mr-1.5" /> Aprovar manualmente
                        </Button>
                      )}
                      {etapa === 'aprovados' && (
                        <Button size="sm" className="h-8" onClick={() => agendarUm(i)} disabled={aprovando !== null || !i.foto_url}>
                          {aprovando === i.id ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <CalendarClock className="h-3.5 w-3.5 mr-1.5" />}
                          Agendar
                        </Button>
                      )}
                      {etapa === 'aprovar' && faltando.length === 0 && (
                        <Button size="sm" className="h-8" onClick={() => aprovarUm(i)} disabled={aprovando !== null}>
                          {aprovando === i.id ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Check className="h-3.5 w-3.5 mr-1.5" />}
                          Aprovar
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <AlertDialog open={!!manual} onOpenChange={(o) => !o && setManual(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprovar manualmente?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>Este artigo ainda tem pendência de SEO. Ele vai para a agenda do WordPress assim mesmo:</p>
                <ul className="list-disc pl-5">
                  {manual && pendencias(manual).map((p) => <li key={p}>{p}</li>)}
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => manual && aprovarManualmente(manual)}>Aprovar assim mesmo</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmarTodos} onOpenChange={setConfirmarTodos}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprovar {aprovaveis.length} artigos?</AlertDialogTitle>
            <AlertDialogDescription>
              Cada um vai direto para a agenda do WordPress, no dia previsto às 9h. Deixe esta página aberta até terminar.
              {lista.length - aprovaveis.length > 0
                ? ` ${lista.length - aprovaveis.length} artigos têm pendência de SEO e ficam de fora; abra cada um para resolver.`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={aprovarTodos}>Aprovar e agendar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
