import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CalendarClock, ShieldCheck, Check, CheckCircle2, Download, ExternalLink, ImageIcon, Loader2, MessageSquareWarning, RotateCcw, Save, Send, Sparkles, Trash2 } from 'lucide-react';
import { CapaBlog, type CapaBlogHandle } from './CapaBlog';
import { agendarArtigo, atualizarCapaNoWordPress, desagendarArtigo } from './agendarNoWordPress';
import { pedidoDeCorrecao } from './corrigirSeo';
import { toast } from 'sonner';
import MainLayout from '@/components/layout/MainLayout';
import RichTextEditor from '@/components/ui/rich-text-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  COR_DA_MARCA,
  MARCAS,
  STATUS,
  buscarNomes,
  conferirArtigo,
  contarPalavras,
  escreverComGemini,
  formatarData,
  linkNoPainelWp,
  pautaDoArtigo,
  produzirAgora,
  rotuloDoAgendamento,
  registrarAprendizado,
  rotuloDoDia,
  type ArtigoBlog,
  type StatusArtigo,
} from './blogTipos';

type Texto = Pick<ArtigoBlog, 'titulo' | 'slug' | 'meta_descricao' | 'tags' | 'conteudo_html'> & { palavra_chave: string };

const textoDe = (a: ArtigoBlog): Texto => ({
  palavra_chave: a.palavra_chave ?? '',
  titulo: a.titulo,
  slug: a.slug,
  meta_descricao: a.meta_descricao,
  tags: a.tags,
  conteudo_html: a.conteudo_html,
});

/** Contador que fica vermelho fora da faixa recomendada pelo SEO. */
const Medidor = ({ atual, min, max }: { atual: number; min: number; max: number }) => (
  <span className={cn('text-xs tabular-nums', atual < min || atual > max ? 'text-destructive' : 'text-muted-foreground')}>
    {atual} de {min === 0 ? `até ${max}` : `${min} a ${max}`} caracteres
  </span>
);

const BlogArtigo = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [artigo, setArtigo] = useState<ArtigoBlog | null>(null);
  const [texto, setTexto] = useState<Texto | null>(null);
  const [nomes, setNomes] = useState<Record<string, string>>({});
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mudou, setMudou] = useState(false);
  // O editor só lê o conteúdo ao nascer. Quando o Gemini reescreve, a chave
  // muda e o editor nasce de novo com o texto novo.
  const [versaoEditor, setVersaoEditor] = useState(0);

  const [pedidoAjuste, setPedidoAjuste] = useState('');
  const [reescrevendo, setReescrevendo] = useState(false);
  const [comentario, setComentario] = useState('');
  // Guardar o pedido como aprendizado: ligado na revisão (costuma valer para os
  // próximos), desligado no ajuste ao Gemini (costuma ser só deste artigo).
  const [guardarRevisao, setGuardarRevisao] = useState(true);
  const [guardarAjuste, setGuardarAjuste] = useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const capaRef = useRef<CapaBlogHandle>(null);
  const [baixando, setBaixando] = useState(false);
  const [agendando, setAgendando] = useState(false);
  const [confirmarManual, setConfirmarManual] = useState(false);

  const carregar = useCallback(async () => {
    const { data, error } = await supabase.from('blog_artigos').select('*').eq('id', id!).maybeSingle();
    if (error || !data) {
      toast.error('Não encontrei esse artigo.');
      navigate('/marketing/blog', { replace: true });
      return;
    }
    const a = data as ArtigoBlog;
    setArtigo(a);
    setTexto(textoDe(a));
    setMudou(false);
    setVersaoEditor((v) => v + 1);
    setNomes(await buscarNomes([a.criado_por, a.enviado_por, a.revisado_por]));
    setCarregando(false);
  }, [id, navigate]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Enquanto a foto da capa está sendo feita, busca só os campos da capa, sem
  // mexer no que o time está editando no texto.
  const capaEmAndamento = artigo?.capa_status === 'pendente' || artigo?.capa_status === 'gerando';
  useEffect(() => {
    if (!capaEmAndamento || !id) return;
    const t = setInterval(async () => {
      const { data } = await supabase.from('blog_artigos').select('foto_url, capa_status, capa_erro').eq('id', id).maybeSingle();
      if (data) setArtigo((a) => (a ? ({ ...a, ...data } as ArtigoBlog) : a));
    }, 10_000);
    return () => clearInterval(t);
  }, [capaEmAndamento, id]);

  if (carregando || !artigo || !texto) {
    return (
      <MainLayout>
        <div className="py-24 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      </MainLayout>
    );
  }

  const status = artigo.status as StatusArtigo;
  const editavel = status === 'rascunho' || status === 'ajustes' || status === 'em_aprovacao';
  const semTexto = status === 'sugestao' || status === 'na_fila' || status === 'gerando' || status === 'falhou';
  const mudar = <K extends keyof Texto>(campo: K, valor: Texto[K]) => {
    setTexto((t) => (t ? { ...t, [campo]: valor } : t));
    setMudou(true);
  };

  /** Grava o texto e, se vier, muda o status junto. */
  const gravar = async (extra: Partial<ArtigoBlog> = {}, aviso = 'Artigo salvo.') => {
    setSalvando(true);
    const { error } = await supabase.from('blog_artigos').update({ ...texto, ...extra }).eq('id', artigo.id);
    setSalvando(false);
    if (error) {
      toast.error('Não consegui salvar. Tente de novo.');
      return false;
    }
    toast.success(aviso);
    await carregar();
    return true;
  };

  const ajustarComGemini = async () => {
    if (!pedidoAjuste.trim()) {
      toast.error('Escreva o que precisa mudar.');
      return;
    }
    setReescrevendo(true);
    try {
      const { artigo: novo } = await escreverComGemini(pautaDoArtigo(artigo), { artigo: texto, pedido: pedidoAjuste.trim() });
      setTexto(novo);
      setMudou(true);
      setVersaoEditor((v) => v + 1);
      if (guardarAjuste) await registrarAprendizado(pedidoAjuste, artigo.marca, 'ajuste_gemini', artigo.id, user?.id);
      setPedidoAjuste('');
      toast.success('O Gemini reescreveu o artigo. Confira e salve se estiver bom.');
    } catch (e) {
      toast.error(e instanceof Error ? `Não deu certo: ${e.message}.` : 'Não deu certo.');
    } finally {
      setReescrevendo(false);
    }
  };

  // Corrige só as pendências de SEO, no texto aberto. O time confere e salva.
  const corrigirSeo = async () => {
    setReescrevendo(true);
    try {
      const { artigo: novo, avisos } = await escreverComGemini(pautaDoArtigo(artigo), {
        artigo: texto,
        pedido: pedidoDeCorrecao(conferirArtigo(texto, texto.palavra_chave)),
      });
      setTexto(novo);
      setMudou(true);
      setVersaoEditor((v) => v + 1);
      if (avisos.length) toast.warning(`Melhorou, mas ainda falta: ${avisos[0]}`);
      else toast.success('SEO corrigido. Confira o texto e clique em Salvar.');
    } catch (e) {
      toast.error(e instanceof Error ? `Não deu certo: ${e.message}.` : 'Não deu certo.');
    } finally {
      setReescrevendo(false);
    }
  };

  const agora = () => new Date().toISOString();
  const enviarParaAprovacao = () =>
    gravar(
      { status: 'em_aprovacao', enviado_por: user?.id ?? null, enviado_em: agora(), comentario_revisao: null },
      'Enviado para aprovação.',
    );
  // Aprovado vai direto para a agenda do WordPress, se a capa já estiver pronta.
  const agendar = async () => {
    setAgendando(true);
    try {
      const r = await agendarArtigo(artigo.id);
      toast.success(`Agendado no WordPress para ${rotuloDoAgendamento(r.agendado_para)}.${r.adiado ? ' O dia previsto já tinha passado.' : ''}`);
    } catch (e) {
      toast.error(e instanceof Error ? `Aprovado, mas não agendou: ${e.message}.` : 'Aprovado, mas não agendou.');
    } finally {
      setAgendando(false);
      carregar();
    }
  };
  const aprovar = async () => {
    const ok = await gravar({ status: 'aprovado', revisado_por: user?.id ?? null, revisado_em: agora() }, 'Artigo aprovado.');
    if (!ok) return;
    if (artigo.foto_url) await agendar();
    else toast.info('Ele vai para a agenda do WordPress quando a capa ficar pronta.');
  };
  // Aprova passando por cima das pendências de SEO (com confirmação). Salva o
  // texto aberto junto, como o Aprovar normal.
  const aprovarManualmente = async () => {
    setConfirmarManual(false);
    const ok = await gravar({ status: 'aprovado', revisado_por: user?.id ?? null, revisado_em: agora() }, 'Artigo aprovado manualmente.');
    if (!ok) return;
    if (artigo.foto_url) await agendar();
    else toast.info('Ele vai para a agenda do WordPress quando a capa ficar pronta.');
  };
  // Depois de "Gerar outra foto" num artigo que já está no WordPress, a capa de
  // lá não muda sozinha: este botão refaz e troca.
  const atualizarCapa = async () => {
    setAgendando(true);
    try {
      await atualizarCapaNoWordPress(artigo.id);
      toast.success('Capa atualizada no WordPress.');
    } catch (e) {
      toast.error(e instanceof Error ? `Não atualizou: ${e.message}.` : 'Não atualizou.');
    } finally {
      setAgendando(false);
      carregar();
    }
  };
  // Agendado que volta para edição sai da agenda do WordPress (vira rascunho lá).
  const desagendar = async () => {
    setAgendando(true);
    try {
      await desagendarArtigo(artigo.id);
      toast.success('Tirado da agenda do WordPress. O artigo voltou para edição.');
    } catch (e) {
      toast.error(e instanceof Error ? `Não consegui tirar da agenda: ${e.message}.` : 'Não consegui tirar da agenda.');
    } finally {
      setAgendando(false);
      carregar();
    }
  };
  const pedirAjustes = async () => {
    if (!comentario.trim()) {
      toast.error('Escreva o que precisa ser ajustado.');
      return;
    }
    const ok = await gravar(
      { status: 'ajustes', revisado_por: user?.id ?? null, revisado_em: agora(), comentario_revisao: comentario.trim() },
      'Pedido de ajuste enviado.',
    );
    if (ok) {
      if (guardarRevisao) await registrarAprendizado(comentario, artigo.marca, 'revisao', artigo.id, user?.id);
      setComentario('');
    }
  };
  const tentarDeNovo = async () => {
    const { error } = await supabase
      .from('blog_artigos')
      .update({ status: 'na_fila', tentativas: 0, erro_geracao: null })
      .eq('id', artigo.id);
    if (error) {
      toast.error('Não consegui devolver à fila.');
      return;
    }
    toast.success('O artigo voltou para a fila.');
    produzirAgora().catch(() => undefined);
    carregar();
  };
  const voltarParaEdicao = () => gravar({ status: 'rascunho' }, 'O artigo voltou para edição.');
  const excluir = async () => {
    const { error } = await supabase.from('blog_artigos').delete().eq('id', artigo.id);
    if (error) {
      toast.error('Não consegui excluir.');
      return;
    }
    toast.success('Artigo excluído.');
    navigate('/marketing/blog');
  };

  const gerarOutraFoto = async () => {
    const { error } = await supabase
      .from('blog_artigos')
      .update({ capa_status: 'pendente', capa_tentativas: 0, capa_erro: null })
      .eq('id', artigo.id);
    if (error) {
      toast.error('Não consegui pedir outra foto.');
      return;
    }
    setArtigo((a) => (a ? { ...a, capa_status: 'pendente', capa_erro: null } : a));
    toast.success('Pedido de foto nova enviado. Leva cerca de um minuto.');
    produzirAgora().catch(() => undefined);
  };

  const baixarCapa = async () => {
    setBaixando(true);
    try {
      const blob = await capaRef.current!.gerarPng();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `capa-${texto.slug || artigo.id}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Não consegui baixar a capa.');
    } finally {
      setBaixando(false);
    }
  };

  const avisoDaCapa =
    artigo.capa_status === 'falhou'
      ? `A foto não saiu: ${artigo.capa_erro ?? 'tente gerar outra'}`
      : capaEmAndamento
        ? 'O Gemini está fazendo a foto'
        : 'Sem foto';

  const palavras = contarPalavras(texto.conteudo_html);
  const pendenciasSeo = conferirArtigo(texto, texto.palavra_chave);
  const nome = (uid: string | null) => (uid ? nomes[uid] ?? 'alguém do time' : '');

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <Link to="/marketing/blog?aba=artigos" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Blog da Pure
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* O artigo */}
          <div className="space-y-4 min-w-0">
            {semTexto && (
              <div className={cn('rounded-xl border p-4 text-sm', status === 'falhou' ? 'border-red-300 bg-red-50 text-red-900' : 'border-border bg-muted/40 text-muted-foreground')}>
                {status === 'sugestao' && 'Esta pauta ainda é uma sugestão. Ela vira texto quando o lote do mês for aprovado no Planejamento.'}
                {status === 'na_fila' && 'Na fila de produção. O Gemini escreve um artigo por vez; esta página mostra o texto assim que ficar pronto.'}
                {status === 'gerando' && 'O Gemini está escrevendo este artigo agora.'}
                {status === 'falhou' && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <span>A escrita falhou três vezes{artigo.erro_geracao ? `: ${artigo.erro_geracao}` : '.'}</span>
                    <Button size="sm" variant="outline" onClick={tentarDeNovo}>Tentar de novo</Button>
                  </div>
                )}
              </div>
            )}
            {status === 'ajustes' && artigo.comentario_revisao && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-semibold flex items-center gap-2">
                  <MessageSquareWarning className="h-4 w-4" />
                  {nome(artigo.revisado_por)} pediu ajustes
                </p>
                <p className="mt-1 whitespace-pre-wrap">{artigo.comentario_revisao}</p>
              </div>
            )}

            {!semTexto && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label className="flex items-center gap-1.5"><ImageIcon className="h-4 w-4" /> Capa</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={gerarOutraFoto} disabled={capaEmAndamento}>
                      {capaEmAndamento ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
                      {capaEmAndamento ? 'Fazendo a foto' : artigo.foto_url ? 'Gerar outra foto' : 'Gerar foto'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={baixarCapa} disabled={!artigo.foto_url || baixando}>
                      {baixando ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Download className="h-3.5 w-3.5 mr-1.5" />}
                      Baixar capa
                    </Button>
                  </div>
                </div>
                <CapaBlog
                  ref={capaRef}
                  marca={artigo.marca}
                  titulo={texto.titulo || artigo.tema}
                  fotoUrl={artigo.foto_url}
                  aviso={avisoDaCapa}
                  carregandoFoto={capaEmAndamento}
                />
                {capaEmAndamento && artigo.foto_url && (
                  <p className="text-xs text-muted-foreground">Uma foto nova está sendo feita. Ela substitui esta em cerca de um minuto.</p>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <Label htmlFor="titulo">Título</Label>
                <Medidor atual={texto.titulo.length} min={0} max={60} />
              </div>
              <Input
                id="titulo"
                className="text-lg font-semibold h-12"
                value={texto.titulo}
                onChange={(e) => mudar('titulo', e.target.value)}
                disabled={!editavel}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <Label>Texto</Label>
                <span className="text-xs text-muted-foreground tabular-nums">{palavras} palavras</span>
              </div>
              <div className={cn('rounded-xl border border-border bg-card overflow-hidden', !editavel && 'pointer-events-none opacity-90')}>
                <RichTextEditor
                  key={versaoEditor}
                  content={texto.conteudo_html}
                  onChange={(html) => mudar('conteudo_html', html)}
                />
              </div>
            </div>
          </div>

          {/* Painel lateral */}
          <aside className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', STATUS[status]?.classe)}>
                  {STATUS[status]?.rotulo}
                </span>
                {mudou && <span className="text-xs text-amber-700">Alterações não salvas</span>}
              </div>
              <ul className="text-xs text-muted-foreground space-y-1">
                {artigo.criado_por && <li>Criado por {nome(artigo.criado_por)} em {formatarData(artigo.created_at)}</li>}
                {artigo.enviado_em && <li>Enviado para aprovação por {nome(artigo.enviado_por)} em {formatarData(artigo.enviado_em)}</li>}
                {status === 'aprovado' && artigo.revisado_em && <li>Aprovado por {nome(artigo.revisado_por)} em {formatarData(artigo.revisado_em)}</li>}
              </ul>

              {editavel && (
                <Button variant="outline" className="w-full" onClick={() => gravar()} disabled={salvando || !mudou}>
                  {salvando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Salvar
                </Button>
              )}

              {(status === 'rascunho' || status === 'ajustes') && (
                <Button className="w-full" onClick={enviarParaAprovacao} disabled={salvando || pendenciasSeo.length > 0}>
                  <Send className="h-4 w-4 mr-2" /> Enviar para aprovação
                </Button>
              )}
              {(status === 'rascunho' || status === 'ajustes' || status === 'em_aprovacao') && pendenciasSeo.length > 0 && (
                <>
                  <p className="text-xs text-amber-800">
                    Há pendência de SEO. Corrija com o Gemini em "Para o Google", ou aprove manualmente.
                  </p>
                  <Button variant="outline" className="w-full" onClick={() => setConfirmarManual(true)} disabled={salvando || agendando}>
                    <ShieldCheck className="h-4 w-4 mr-2" /> Aprovar manualmente
                  </Button>
                </>
              )}

              {status === 'em_aprovacao' && (
                <div className="space-y-2 pt-1">
                  <Button className="w-full" onClick={aprovar} disabled={salvando || pendenciasSeo.length > 0}>
                    <Check className="h-4 w-4 mr-2" /> Aprovar
                  </Button>
                  <Textarea
                    rows={3}
                    placeholder="Ou escreva o que precisa mudar e devolva para edição."
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                  />
                  <label className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Checkbox checked={guardarRevisao} onCheckedChange={(v) => setGuardarRevisao(v === true)} className="mt-0.5" />
                    Guardar como aprendizado para os próximos artigos de {MARCAS[artigo.marca]?.nome}
                  </label>
                  <Button variant="outline" className="w-full" onClick={pedirAjustes} disabled={salvando}>
                    <MessageSquareWarning className="h-4 w-4 mr-2" /> Pedir ajustes
                  </Button>
                </div>
              )}

              {status === 'aprovado' && (
                <>
                  {artigo.wp_erro && <p className="text-xs text-destructive">O WordPress não aceitou: {artigo.wp_erro}</p>}
                  {!artigo.foto_url && <p className="text-xs text-muted-foreground">Esperando a capa ficar pronta para agendar.</p>}
                  <Button className="w-full" onClick={agendar} disabled={agendando || !artigo.foto_url}>
                    {agendando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CalendarClock className="h-4 w-4 mr-2" />}
                    Agendar no WordPress
                  </Button>
                  <Button variant="outline" className="w-full" onClick={voltarParaEdicao} disabled={salvando || agendando}>
                    <RotateCcw className="h-4 w-4 mr-2" /> Voltar para edição
                  </Button>
                </>
              )}

              {status === 'publicado' && (
                <>
                  <p className="text-sm text-emerald-800 flex items-center gap-1.5">
                    <Check className="h-4 w-4" /> Publicado {rotuloDoAgendamento(artigo.publicado_em ?? artigo.agendado_para ?? artigo.updated_at)}
                  </p>
                  {artigo.wp_url && (
                    <Button asChild variant="outline" className="w-full">
                      <a href={artigo.wp_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" /> Ver no blog
                      </a>
                    </Button>
                  )}
                </>
              )}

              {status === 'agendado' && (
                <>
                  {artigo.agendado_para && (
                    <p className="text-sm text-sky-800 flex items-center gap-1.5">
                      <CalendarClock className="h-4 w-4" /> Vai ao ar {rotuloDoAgendamento(artigo.agendado_para)}
                    </p>
                  )}
                  {artigo.wp_post_id && (
                    <Button asChild variant="outline" className="w-full">
                      <a href={linkNoPainelWp(artigo.wp_post_id)} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" /> Ver no WordPress
                      </a>
                    </Button>
                  )}
                  <Button variant="outline" className="w-full" onClick={desagendar} disabled={agendando}>
                    {agendando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RotateCcw className="h-4 w-4 mr-2" />}
                    Tirar da agenda e editar
                  </Button>
                </>
              )}

              {(status === 'agendado' || status === 'publicado') && artigo.wp_post_id && (
                <Button variant="outline" className="w-full" onClick={atualizarCapa} disabled={agendando || !artigo.foto_url || capaEmAndamento}>
                  {agendando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ImageIcon className="h-4 w-4 mr-2" />}
                  Atualizar capa no WordPress
                </Button>
              )}
            </div>

            {editavel && (
              <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Ajustar com o Gemini
                </p>
                <Textarea
                  rows={3}
                  placeholder="Ex.: deixe a abertura mais curta e inclua um trecho sobre respiração."
                  value={pedidoAjuste}
                  onChange={(e) => setPedidoAjuste(e.target.value)}
                  disabled={reescrevendo}
                />
                <label className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Checkbox checked={guardarAjuste} onCheckedChange={(v) => setGuardarAjuste(v === true)} className="mt-0.5" />
                  Guardar como aprendizado para os próximos artigos de {MARCAS[artigo.marca]?.nome}
                </label>
                <Button variant="secondary" className="w-full" onClick={ajustarComGemini} disabled={reescrevendo}>
                  {reescrevendo ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  {reescrevendo ? 'Reescrevendo...' : 'Reescrever'}
                </Button>
              </div>
            )}

            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <p className="text-sm font-semibold">Para o Google</p>
              {pendenciasSeo.length === 0 ? (
                <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 shrink-0" /> Todas as regras de SEO estão cumpridas.
                </p>
              ) : (
                <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" /> Regras de SEO para conferir
                  </p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {pendenciasSeo.map((p) => <li key={p}>{p}</li>)}
                  </ul>
                  {editavel && (
                    <Button size="sm" variant="secondary" className="w-full mt-2 h-8" onClick={corrigirSeo} disabled={reescrevendo}>
                      {reescrevendo ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
                      {reescrevendo ? 'Corrigindo...' : 'Corrigir com o Gemini'}
                    </Button>
                  )}
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="palavra">Palavra-chave principal</Label>
                <Input
                  id="palavra"
                  value={texto.palavra_chave}
                  onChange={(e) => mudar('palavra_chave', e.target.value)}
                  disabled={!editavel}
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <Label htmlFor="meta">Descrição</Label>
                  <Medidor atual={texto.meta_descricao.length} min={140} max={160} />
                </div>
                <Textarea
                  id="meta"
                  rows={4}
                  value={texto.meta_descricao}
                  onChange={(e) => mudar('meta_descricao', e.target.value)}
                  disabled={!editavel}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slug">Endereço do post</Label>
                <Input id="slug" value={texto.slug} onChange={(e) => mudar('slug', e.target.value)} disabled={!editavel} />
                <p className="text-xs text-muted-foreground break-all">blog.purepilates.com.br/{texto.slug}/</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={texto.tags.join(', ')}
                  onChange={(e) => mudar('tags', e.target.value.split(',').map((t) => t.trim()).filter(Boolean))}
                  disabled={!editavel}
                />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 space-y-1 text-xs text-muted-foreground">
              <p className="text-sm font-semibold text-foreground mb-1">Pauta</p>
              <p><span className="font-medium text-foreground">Tema:</span> {artigo.tema}</p>
              {artigo.categoria && <p><span className="font-medium text-foreground">Categoria:</span> {artigo.categoria}</p>}
              <p className="flex items-center gap-1.5">
                <span className="font-medium text-foreground">Marca:</span>
                <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', COR_DA_MARCA[artigo.marca])}>{MARCAS[artigo.marca]?.nome}</span>
              </p>
              {artigo.data_prevista && <p><span className="font-medium text-foreground">Dia previsto:</span> {rotuloDoDia(artigo.data_prevista)}</p>}
              {artigo.observacoes && <p><span className="font-medium text-foreground">Orientações:</span> {artigo.observacoes}</p>}
            </div>

            {(status === 'rascunho' || status === 'ajustes') && (
              <Button variant="ghost" className="w-full text-destructive hover:text-destructive" onClick={() => setConfirmarExclusao(true)}>
                <Trash2 className="h-4 w-4 mr-2" /> Excluir artigo
              </Button>
            )}
          </aside>
        </div>
      </div>

      <AlertDialog open={confirmarManual} onOpenChange={setConfirmarManual}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprovar manualmente?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>O artigo vai para a agenda do WordPress com estas pendências de SEO:</p>
                <ul className="list-disc pl-5">
                  {pendenciasSeo.map((p) => <li key={p}>{p}</li>)}
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={aprovarManualmente}>Aprovar assim mesmo</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmarExclusao} onOpenChange={setConfirmarExclusao}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir este artigo?</AlertDialogTitle>
            <AlertDialogDescription>O texto e a pauta somem do Hub. Não dá para desfazer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={excluir}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default BlogArtigo;
