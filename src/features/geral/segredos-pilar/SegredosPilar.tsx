import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Maximize,
  Minimize,
  Play,
  RefreshCcw,
  Send,
} from 'lucide-react';
import logoHorizontal from '@/assets/segredos-pilar/logo-horizontal-escuro.png';
import SimboloSegredosPilar from './SimboloSegredosPilar';
import { usePublicacaoSegredosPilar } from './usePublicacaoSegredosPilar';
import type { Episodio, Temporada } from '../../../../supabase/functions/segredos-pilar-episodios/pasta';

// Os segredos de Pilar — série em vídeo. Começa só para colaboradores e um
// admin libera para todos pelo botão "Publicar para todos" (como a Timeline).
//
// Os vídeos moram numa pasta do Drive e tocam pelo player do Drive dentro de um
// iframe (o tráfego de vídeo não passa pelo Supabase — decisão de 16/09/2026).
// A lista vem da Edge Function segredos-pilar-episodios.
//
// Para ninguém "cair" no Drive:
// - o iframe não tem allowFullScreen: a tela cheia é a nossa, sobre o bloco que
//   inclui a proteção abaixo (a tela cheia do Drive mostraria o botão dele);
// - um bloco transparente cobre o canto superior direito, onde o Drive põe o
//   botão "abrir em nova janela".
// Isso esconde o Drive da interface. Não é sigilo: quem abrir o inspetor do
// navegador ainda encontra o endereço do iframe.

type Resposta = { temporadas: Temporada[] };

const CHAVE_ASSISTIDOS = 'segredos-pilar:assistidos';
const CHAVE_ULTIMO = 'segredos-pilar:ultimo';

const lerLocal = <T,>(chave: string, padrao: T): T => {
  try {
    const v = localStorage.getItem(chave);
    return v ? (JSON.parse(v) as T) : padrao;
  } catch {
    return padrao;
  }
};

const gravarLocal = (chave: string, valor: unknown) => {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    // modo privado / armazenamento bloqueado: só perde o "assistido"
  }
};

const rotuloDoEpisodio = (ep: Episodio) => (ep.numero !== null ? `Episódio ${ep.numero}` : 'Especial');

const SegredosPilar = () => {
  const { isAdmin, isColaborador } = useAuth();
  const { publicado, carregando: carregandoPublicacao, publicar } = usePublicacaoSegredosPilar();
  // Antes de publicar, só colaboradores/admins (pré-visualização), como na Timeline.
  const podeVer = publicado || isColaborador;

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['segredos-pilar-episodios'],
    enabled: podeVer,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<Resposta>('segredos-pilar-episodios');
      if (error) throw error;
      return data!;
    },
    staleTime: 2 * 60 * 1000,
  });

  const temporadas = useMemo(() => data?.temporadas ?? [], [data]);
  // Ordem de reprodução: todas as temporadas em sequência.
  const fila = useMemo(() => temporadas.flatMap((t) => t.episodios), [temporadas]);

  const [assistidos, setAssistidos] = useState<string[]>(() => lerLocal(CHAVE_ASSISTIDOS, []));
  const [ultimo, setUltimo] = useState<string | null>(() => lerLocal(CHAVE_ULTIMO, null));
  const [tocando, setTocando] = useState<Episodio | null>(null);

  const abrir = useCallback((ep: Episodio) => {
    setTocando(ep);
    setUltimo(ep.driveId);
    gravarLocal(CHAVE_ULTIMO, ep.driveId);
    setAssistidos((atual) => {
      if (atual.includes(ep.driveId)) return atual;
      const novo = [...atual, ep.driveId];
      gravarLocal(CHAVE_ASSISTIDOS, novo);
      return novo;
    });
  }, []);

  // Destaque: o último aberto (continuar) ou o primeiro ainda não visto.
  const destaque = useMemo(() => {
    const ultimoEp = fila.find((e) => e.driveId === ultimo);
    if (ultimoEp) return { ep: ultimoEp, continuar: true };
    const proximo = fila.find((e) => !assistidos.includes(e.driveId)) ?? fila[0];
    return proximo ? { ep: proximo, continuar: false } : null;
  }, [fila, ultimo, assistidos]);

  const indiceTocando = tocando ? fila.findIndex((e) => e.driveId === tocando.driveId) : -1;

  if (!podeVer) {
    return (
      <MainLayout>
        <div className="max-w-6xl mx-auto">
          <section className="rounded-3xl bg-neutral-950 text-white min-h-[340px] flex flex-col items-center justify-center gap-5 p-8 text-center">
            {carregandoPublicacao ? (
              <Loader2 className="h-8 w-8 animate-spin text-white/60" />
            ) : (
              <>
                <h1>
                  <span className="sr-only">Os segredos de Pilar</span>
                  <img src={logoHorizontal} alt="" aria-hidden className="h-20 sm:h-28 w-auto" />
                </h1>
                <p className="text-white/70">Em breve.</p>
              </>
            )}
          </section>
        </div>
      </MainLayout>
    );
  }

  const handlePublicar = () =>
    publicar.mutate(undefined, {
      onSuccess: () => toast.success('Os segredos de Pilar publicado para todos!'),
      onError: (err) => {
        console.error(err);
        toast.error('Erro ao publicar a série.');
      },
    });

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        {/* Barra de publicação — mesmo molde da Timeline do Mês */}
        {isAdmin && !publicado && !carregandoPublicacao && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-3 flex-1">
              <Eye className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Modo pré-visualização</p>
                <p className="text-xs text-muted-foreground">
                  Apenas colaboradores podem ver a série. Franqueados verão &quot;em breve&quot;.
                </p>
              </div>
            </div>
            <Button onClick={handlePublicar} disabled={publicar.isPending} className="gap-2">
              <Send className="h-4 w-4" />
              {publicar.isPending ? 'Publicando...' : 'Publicar para todos'}
            </Button>
          </div>
        )}

        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-neutral-950 text-white min-h-[340px] sm:min-h-[420px] flex items-end">
          {destaque?.ep.capa && (
            <img
              src={destaque.ep.capa}
              alt=""
              referrerPolicy="no-referrer"
              className="absolute inset-0 h-full w-full object-cover opacity-60"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-neutral-950/30 to-transparent" />

          <div className="relative p-6 sm:p-10 max-w-2xl">
            <h1>
              <span className="sr-only">Os segredos de Pilar</span>
              <img
                src={logoHorizontal}
                alt=""
                aria-hidden
                className="h-20 sm:h-28 w-auto drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]"
              />
            </h1>

            {isLoading && (
              <p className="mt-4 flex items-center gap-2 text-white/70">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando episódios…
              </p>
            )}

            {destaque && (
              <>
                <p className="mt-4 text-sm sm:text-base text-white/80">
                  {destaque.continuar ? 'Continue de onde parou · ' : ''}
                  <span className="font-semibold text-white">{rotuloDoEpisodio(destaque.ep)}</span> ·{' '}
                  {destaque.ep.titulo}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Button
                    size="lg"
                    onClick={() => abrir(destaque.ep)}
                    className="bg-white text-neutral-950 hover:bg-white/90 gap-2 font-semibold"
                  >
                    <Play className="h-5 w-5 fill-current" />
                    {destaque.continuar ? 'Continuar' : 'Assistir'}
                  </Button>
                  <span className="text-sm text-white/60">
                    {fila.length} {fila.length === 1 ? 'episódio' : 'episódios'}
                  </span>
                </div>
              </>
            )}
          </div>
        </section>

        {isError && (
          <div className="mt-8 rounded-2xl border border-border/60 bg-card p-6 text-center">
            <p className="text-foreground font-medium">Não foi possível carregar os episódios agora.</p>
            <Button variant="outline" className="mt-4 gap-2" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCcw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
              Tentar de novo
            </Button>
          </div>
        )}

        {!isLoading && !isError && fila.length === 0 && (
          <p className="mt-8 text-center text-muted-foreground">Os episódios chegam em breve.</p>
        )}

        {temporadas.map((temporada) => (
          <section key={temporada.titulo ?? 'raiz'} className="mt-10">
            <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4">
              {temporada.titulo ?? 'Episódios'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {temporada.episodios.map((ep) => (
                <CardDoEpisodio
                  key={ep.driveId}
                  ep={ep}
                  assistido={assistidos.includes(ep.driveId)}
                  onPlay={() => abrir(ep)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {tocando && (
        <Player
          ep={tocando}
          anterior={indiceTocando > 0 ? fila[indiceTocando - 1] : null}
          proximo={indiceTocando >= 0 && indiceTocando < fila.length - 1 ? fila[indiceTocando + 1] : null}
          onTrocar={abrir}
          onFechar={() => setTocando(null)}
        />
      )}
    </MainLayout>
  );
};

const CardDoEpisodio = ({ ep, assistido, onPlay }: { ep: Episodio; assistido: boolean; onPlay: () => void }) => (
  <button
    type="button"
    onClick={onPlay}
    className="group text-left rounded-2xl overflow-hidden bg-card border border-border/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
  >
    <div className="relative aspect-video bg-neutral-900 overflow-hidden">
      {ep.capa ? (
        <img
          src={ep.capa}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-primary/80 to-neutral-900 flex items-center justify-center">
          <span className="text-6xl font-bold text-white/30">{ep.numero ?? '★'}</span>
        </div>
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
        <span className="h-14 w-14 rounded-full bg-white/95 text-neutral-950 flex items-center justify-center opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all">
          <Play className="h-6 w-6 fill-current ml-0.5" />
        </span>
      </div>
      {assistido && (
        <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-medium text-white">
          <Check className="h-3 w-3" /> Assistido
        </span>
      )}
    </div>
    <div className="p-4">
      <p className="text-xs font-semibold text-primary uppercase tracking-wider">{rotuloDoEpisodio(ep)}</p>
      <p className="mt-1 text-base font-semibold text-foreground leading-snug">{ep.titulo}</p>
    </div>
  </button>
);

const Player = ({
  ep,
  anterior,
  proximo,
  onTrocar,
  onFechar,
}: {
  ep: Episodio;
  anterior: Episodio | null;
  proximo: Episodio | null;
  onTrocar: (ep: Episodio) => void;
  onFechar: () => void;
}) => {
  const telaRef = useRef<HTMLDivElement>(null);
  const [telaCheia, setTelaCheia] = useState(false);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => setCarregando(true), [ep.driveId]);

  useEffect(() => {
    const aoMudar = () => setTelaCheia(document.fullscreenElement === telaRef.current);
    document.addEventListener('fullscreenchange', aoMudar);
    return () => document.removeEventListener('fullscreenchange', aoMudar);
  }, []);

  // Esc fecha o player (quando não está em tela cheia — aí o Esc é do navegador).
  // Trava a rolagem da página por trás.
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.fullscreenElement) onFechar();
    };
    window.addEventListener('keydown', aoTeclar);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', aoTeclar);
      document.body.style.overflow = overflow;
    };
  }, [onFechar]);

  const alternarTelaCheia = () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else telaRef.current?.requestFullscreen?.();
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={ep.titulo} className="fixed inset-0 z-[60] bg-neutral-950 text-white flex flex-col">
      <header className="flex items-center gap-3 px-4 sm:px-6 py-3">
        <Button variant="ghost" size="icon" onClick={onFechar} className="text-white hover:bg-white/10 hover:text-white" aria-label="Voltar">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <SimboloSegredosPilar className="h-9 w-9 shrink-0 brightness-0 invert" />
        <div className="min-w-0">
          <p className="text-xs text-white/60 uppercase tracking-wider">Os segredos de Pilar · {rotuloDoEpisodio(ep)}</p>
          <p className="font-semibold truncate">{ep.titulo}</p>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex items-center justify-center px-2 sm:px-6">
        <div
          ref={telaRef}
          className={cn(
            'relative w-full bg-black overflow-hidden',
            telaCheia ? 'h-full' : 'max-w-6xl aspect-video max-h-full rounded-xl',
          )}
        >
          {carregando && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-white/60" />
            </div>
          )}
          <iframe
            key={ep.driveId}
            src={`https://drive.google.com/file/d/${ep.driveId}/preview`}
            title={ep.titulo}
            allow="autoplay; encrypted-media"
            referrerPolicy="no-referrer"
            onLoad={() => setCarregando(false)}
            className="absolute inset-0 h-full w-full border-0"
          />
          {/* Cobre o botão "abrir em nova janela" do Drive. */}
          <div aria-hidden className="absolute top-0 right-0 h-16 w-24" onContextMenu={(e) => e.preventDefault()} />
          <button
            type="button"
            onClick={alternarTelaCheia}
            aria-label={telaCheia ? 'Sair da tela cheia' : 'Tela cheia'}
            className="absolute top-3 right-3 h-10 w-10 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
          >
            {telaCheia ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <footer className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4">
        <Button
          variant="ghost"
          disabled={!anterior}
          onClick={() => anterior && onTrocar(anterior)}
          className="text-white hover:bg-white/10 hover:text-white gap-1 disabled:opacity-30"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="hidden sm:inline">Anterior</span>
        </Button>
        {proximo && (
          <Button onClick={() => onTrocar(proximo)} className="bg-white text-neutral-950 hover:bg-white/90 gap-2 font-semibold min-w-0">
            <span className="truncate">
              Próximo: {rotuloDoEpisodio(proximo)} · {proximo.titulo}
            </span>
            <ChevronRight className="h-5 w-5 shrink-0" />
          </Button>
        )}
      </footer>
    </div>
  );
};

export default SegredosPilar;
