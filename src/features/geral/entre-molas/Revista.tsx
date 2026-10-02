import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Maximize, Minimize, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NavegacaoContext } from './diagramacao';

// Motor da revista folheável.
//
// Cada página tem 820 × 1000 (o tamanho do Canva). Em tela larga a revista
// abre em página dupla: a capa fica sozinha à direita (revista fechada), depois
// vêm os pares 1|2, 3|4… e a contracapa fecha sozinha à esquerda. Em tela
// estreita mostra uma página por vez.
//
// Virar = uma "folha" com frente e verso gira 180° em torno da lombada. Por
// baixo dela já estão as páginas de destino, então quando a folha assenta a
// troca de estado é invisível.

const PAGINA_L = 820;
const PAGINA_A = 1000;
const DURACAO = 0.95;
const EASE = [0.645, 0.045, 0.355, 1] as const;

export type RenderPagina = (lado: 'esquerda' | 'direita' | 'solta') => ReactNode;

export interface Capitulo {
  rotulo: string;
  /** Página onde o capítulo começa (a capa é a 0). */
  pagina: number;
}

interface RevistaProps {
  paginas: RenderPagina[];
  /** Fundo que tinge a tela enquanto a capa está à vista. */
  brilhoCapa?: string;
  /** Barra de atalhos acima da revista. */
  capitulos?: Capitulo[];
  /** Abre direto nesta página (a capa é a 0). */
  paginaInicial?: number;
  /** Faixa acima da barra de capítulos (ex.: aviso de pré-visualização). */
  aviso?: ReactNode;
}

interface Virada {
  de: number;
  para: number;
}

const Revista = ({ paginas, brilhoCapa, capitulos = [], paginaInicial = 0, aviso }: RevistaProps) => {
  const palcoRef = useRef<HTMLDivElement>(null);
  const [tamanho, setTamanho] = useState({ l: 0, a: 0 });
  const [pos, setPos] = useState(paginaInicial);
  // Celular: uma página por vez, na largura da tela. "Ampliar" aproxima a página para leitura (rola com o dedo).
  const [zoom, setZoom] = useState(false);
  const [virada, setVirada] = useState<Virada | null>(null);
  const [telaCheia, setTelaCheia] = useState(false);

  const total = paginas.length;
  const dupla = tamanho.l >= 900;

  // Posições: em página dupla cada posição é um par; em simples, uma página.
  const totalPos = dupla ? Math.floor(total / 2) + 1 : total;
  const esquerdaDe = (k: number) => (2 * k - 1 >= 0 && 2 * k - 1 < total ? 2 * k - 1 : null);
  const direitaDe = (k: number) => (2 * k < total ? 2 * k : null);
  const posDaPagina = useCallback((p: number) => (dupla ? Math.floor((p + 1) / 2) : p), [dupla]);

  // Ao trocar entre simples e dupla, mantém a página que estava à vista.
  const duplaAnterior = useRef(dupla);
  useEffect(() => {
    if (duplaAnterior.current === dupla) return;
    setPos((p) => (dupla ? Math.floor((p + 1) / 2) : Math.max(0, 2 * p - 1)));
    duplaAnterior.current = dupla;
  }, [dupla]);

  useLayoutEffect(() => {
    const el = palcoRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      setTamanho({ l: e.contentRect.width, a: e.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const irPara = useCallback(
    (destino: number) => {
      if (virada) return;
      const alvo = Math.max(0, Math.min(totalPos - 1, destino));
      if (alvo === pos) return;
      setVirada({ de: pos, para: alvo });
    },
    [virada, pos, totalPos],
  );

  const terminarVirada = useCallback(() => {
    if (!virada) return;
    setPos(virada.para);
    setVirada(null);
  }, [virada]);

  const navegacao = useMemo(
    () => ({ irParaPagina: (p: number) => irPara(posDaPagina(p)) }),
    [irPara, posDaPagina],
  );

  const avancar = useCallback(() => irPara(pos + 1), [irPara, pos]);
  const voltar = useCallback(() => irPara(pos - 1), [irPara, pos]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') avancar();
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') voltar();
      if (e.key === 'Home') irPara(0);
      if (e.key === 'End') irPara(totalPos - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [avancar, voltar, irPara, totalPos]);

  // Tela cheia de verdade (API do navegador), sobre o palco.
  useEffect(() => {
    const onChange = () => setTelaCheia(document.fullscreenElement === palcoRef.current?.parentElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);
  const alternarTelaCheia = () => {
    const alvo = palcoRef.current?.parentElement;
    if (!alvo) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else alvo.requestFullscreen?.();
  };

  const ampliado = zoom && !dupla;
  // ao virar a página ampliada, volta para o topo dela
  useEffect(() => {
    palcoRef.current?.scrollTo({ top: 0, left: 0 });
  }, [pos, ampliado]);

  // Arrastar / deslizar para virar (toque e mouse).
  // Guarda onde o dedo começou e por onde anda: no celular o navegador às vezes "cancela" o toque (acha que é
  // rolagem), então a virada é decidida pela última posição conhecida, venha o fim por pointerup ou pointercancel.
  const arraste = useRef<{ x: number; y: number; ux: number; uy: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    arraste.current = { x: e.clientX, y: e.clientY, ux: e.clientX, uy: e.clientY };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (arraste.current) { arraste.current.ux = e.clientX; arraste.current.uy = e.clientY; }
  };
  const fimDoArraste = (e: React.PointerEvent) => {
    const ini = arraste.current;
    arraste.current = null;
    if (!ini || ampliado) return; // ampliado: o dedo rola a página, não vira
    const fx = e.type === 'pointercancel' ? ini.ux : e.clientX;
    const fy = e.type === 'pointercancel' ? ini.uy : e.clientY;
    const dx = fx - ini.x;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(fy - ini.y) * 1.2) {
      if (dx < 0) avancar();
      else voltar();
    }
  };

  // Revista fechada (capa ou contracapa) fica centralizada e ocupa a altura
  // toda; aberta, a página dupla ocupa o máximo que couber. A troca de escala
  // é animada junto com a virada — a revista "chega mais perto" ao abrir.
  const livroL = dupla ? PAGINA_L * 2 : PAGINA_L;
  const posVisivel = virada ? virada.para : pos;
  const fechado = dupla && (posVisivel === 0 || direitaDe(posVisivel) === null);
  let deslocamento = 0;
  if (dupla && posVisivel === 0) deslocamento = -PAGINA_L / 2;
  if (dupla && direitaDe(posVisivel) === null) deslocamento = PAGINA_L / 2;

  // celular: a página encosta nas bordas da tela; sobra espaço embaixo para os controles
  const margemL = dupla ? 150 : 0;
  const margemA = dupla ? 28 : 112;
  const escala = tamanho.l
    ? Math.min((tamanho.l - margemL) / (fechado ? PAGINA_L : livroL), (tamanho.a - margemA) / PAGINA_A)
    : 0;
  const naCapa = posVisivel === 0;
  // ampliada, a página fica perto do tamanho real (texto legível) e rola dentro do palco
  // 1,8×: uma coluna de texto ocupa a largura do celular; rola-se para os lados e para baixo para ver o resto
  const escalaTela = ampliado ? Math.min(1.1, escala * 1.8) : escala;

  const pagina = (i: number | null, lado: 'esquerda' | 'direita' | 'solta') =>
    i === null ? null : paginas[i](lado);

  // ---------- montagem da cena ----------
  let fundoEsq: number | null = null;
  let fundoDir: number | null = null;
  let folha: ReactNode = null;

  if (dupla) {
    if (!virada) {
      fundoEsq = esquerdaDe(pos);
      fundoDir = direitaDe(pos);
    } else if (virada.para > virada.de) {
      fundoEsq = esquerdaDe(virada.de);
      fundoDir = direitaDe(virada.para);
      folha = (
        <Folha
          key={`f${virada.de}-${virada.para}`}
          x={PAGINA_L}
          origem="left"
          de={0}
          ate={-180}
          frente={pagina(direitaDe(virada.de), direitaDe(virada.de) === 0 ? 'solta' : 'direita')}
          verso={pagina(esquerdaDe(virada.para), direitaDe(virada.para) === null ? 'solta' : 'esquerda')}
          onFim={terminarVirada}
        />
      );
    } else {
      fundoEsq = esquerdaDe(virada.para);
      fundoDir = direitaDe(virada.de);
      folha = (
        <Folha
          key={`t${virada.de}-${virada.para}`}
          x={0}
          origem="right"
          de={0}
          ate={180}
          frente={pagina(esquerdaDe(virada.de), direitaDe(virada.de) === null ? 'solta' : 'esquerda')}
          verso={pagina(direitaDe(virada.para), virada.para === 0 ? 'solta' : 'direita')}
          onFim={terminarVirada}
        />
      );
    }
  } else {
    if (!virada) {
      fundoDir = pos;
    } else if (virada.para > virada.de) {
      fundoDir = virada.para;
      folha = (
        <Folha
          key={`f${virada.de}-${virada.para}`}
          x={0}
          origem="left"
          de={0}
          ate={-180}
          frente={pagina(virada.de, 'solta')}
          verso={<div className="em-page em-page--solta" />}
          onFim={terminarVirada}
        />
      );
    } else {
      fundoDir = virada.de;
      folha = (
        <Folha
          key={`t${virada.de}-${virada.para}`}
          x={0}
          origem="left"
          de={-180}
          ate={0}
          frente={pagina(virada.para, 'solta')}
          verso={<div className="em-page em-page--solta" />}
          onFim={terminarVirada}
        />
      );
    }
  }

  const podeVoltar = pos > 0 && !virada;
  const podeAvancar = pos < totalPos - 1 && !virada;

  const ladoEsq = dupla && direitaDe(pos) === null ? 'solta' : 'esquerda';
  const ladoDir = !dupla || pos === 0 ? 'solta' : 'direita';

  // Numeração mostrada embaixo.
  const rotulo = (() => {
    if (!dupla) return pos === 0 ? 'Capa' : `${pos} / ${total - 1}`;
    const e = esquerdaDe(pos);
    const d = direitaDe(pos);
    if (e === null) return 'Capa';
    if (d === null) return 'Contracapa';
    return `${e}–${d} / ${total - 1}`;
  })();

  // Capítulo ativo: o último que começa até a página mais à frente que está à vista.
  const ultimaVisivel = dupla ? (direitaDe(posVisivel) ?? esquerdaDe(posVisivel) ?? 0) : posVisivel;
  const ativo = [...capitulos].reverse().find((c) => c.pagina <= ultimaVisivel);

  const botaoSeta =
    (dupla ? 'h-14 w-14 ' : 'h-11 w-11 ') +
    'pointer-events-auto flex items-center justify-center rounded-full border border-white/15 bg-black/25 text-white/85 backdrop-blur-md transition hover:scale-105 hover:bg-white/15 disabled:pointer-events-none disabled:opacity-0';

  return (
    <NavegacaoContext.Provider value={navegacao}>
    <div className="flex h-full w-full flex-col">
    {aviso}
    {capitulos.length > 0 && (
      <nav
        aria-label="Capítulos"
        className="relative z-10 flex h-16 shrink-0 items-center gap-1.5 overflow-x-auto border-b border-white/10 bg-black/40 px-4 pr-16 backdrop-blur-md [scrollbar-width:none]"
      >
        {capitulos.map((c) => {
          const eAtivo = ativo === c;
          return (
            <button
              key={c.pagina}
              type="button"
              onClick={() => navegacao.irParaPagina(c.pagina)}
              aria-current={eAtivo ? 'page' : undefined}
              className={cn(
                'em-sans relative shrink-0 whitespace-nowrap rounded-full px-5 py-2.5 text-[13px] font-semibold uppercase tracking-[0.12em] transition-colors',
                eAtivo ? 'bg-[#a9293b] text-white' : 'text-white/60 hover:bg-white/10 hover:text-white',
              )}
            >
              {c.rotulo}
            </button>
          );
        })}
      </nav>
    )}
    <div className="relative min-h-0 w-full flex-1">
      {/* luz ambiente: na capa, o vinho dela tinge a tela inteira */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-1000"
        style={{ background: brilhoCapa, opacity: naCapa ? 1 : 0 }}
      />
      <div
        ref={palcoRef}
        className={cn(
          'absolute inset-0',
          ampliado ? 'overflow-auto overscroll-contain [-webkit-overflow-scrolling:touch]' : 'flex items-center justify-center overflow-hidden',
          !dupla && !ampliado && 'pb-12',
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={fimDoArraste}
        onPointerCancel={fimDoArraste}
        // sem zoom a página cabe na tela: o navegador não rola nada e o arrastar do dedo vira a página
        style={{ touchAction: ampliado ? 'pan-x pan-y pinch-zoom' : 'pinch-zoom' }}
      >
        {escala > 0 && (
          <div
            style={{
              width: livroL * escalaTela,
              height: PAGINA_A * escalaTela,
              marginBottom: ampliado ? 64 : undefined,
              flexShrink: 0,
              transition: 'width 0.95s cubic-bezier(0.645,0.045,0.355,1), height 0.95s cubic-bezier(0.645,0.045,0.355,1)',
            }}
            className="relative"
          >
            <div
              style={{
                width: livroL,
                height: PAGINA_A,
                transform: `scale(${escalaTela})`,
                transformOrigin: 'top left',
                transition: 'transform 0.95s cubic-bezier(0.645,0.045,0.355,1)',
              }}
            >
              <div className="em-book" style={{ transform: `translateX(${deslocamento}px)` }}>
                {fundoEsq !== null && (
                  <div
                    className={cn('em-slot em-slot--esquerda', !virada && podeVoltar && 'em-slot--vira')}
                    style={{ left: 0 }}
                    onClick={() => !ampliado && podeVoltar && voltar()}
                  >
                    {pagina(fundoEsq, ladoEsq)}
                    {!virada && podeVoltar && <div className="em-curl em-curl--esquerda" />}
                  </div>
                )}
                {fundoDir !== null && (
                  <div
                    className={cn('em-slot em-slot--direita', !virada && podeAvancar && 'em-slot--vira')}
                    style={{ left: dupla ? PAGINA_L : 0 }}
                    onClick={() => !ampliado && podeAvancar && avancar()}
                  >
                    {pagina(fundoDir, ladoDir)}
                    {!virada && podeAvancar && <div className="em-curl em-curl--direita" />}
                  </div>
                )}
                {folha}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* setas nas laterais */}
      <div className={cn('pointer-events-none absolute left-0 flex items-center', dupla ? 'inset-y-0 pl-4' : 'bottom-2 pl-3')}>
        <button type="button" onClick={voltar} disabled={!podeVoltar} aria-label="Página anterior" className={botaoSeta}>
          <ChevronLeft className="h-6 w-6" />
        </button>
      </div>
      <div className={cn('pointer-events-none absolute right-0 flex items-center', dupla ? 'inset-y-0 pr-4' : 'bottom-2 pr-3')}>
        <button type="button" onClick={avancar} disabled={!podeAvancar} aria-label="Próxima página" className={botaoSeta}>
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      {/* numeração e tela cheia, discretos */}
      <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2">
        <div className="em-sans rounded-full bg-black/35 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/70 backdrop-blur-md">
          {rotulo}
        </div>
      </div>
      {!dupla && (
        <button
          type="button"
          onClick={() => setZoom((z) => !z)}
          aria-label={ampliado ? 'Ver a página inteira' : 'Ampliar para ler'}
          className="em-sans absolute right-16 top-4 flex h-10 items-center gap-2 rounded-full bg-black/45 px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/85 backdrop-blur-md"
        >
          {ampliado ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
          {ampliado ? 'Página inteira' : 'Ampliar'}
        </button>
      )}
      <button
        type="button"
        onClick={alternarTelaCheia}
        aria-label={telaCheia ? 'Sair da tela cheia' : 'Tela cheia'}
        title={telaCheia ? 'Sair da tela cheia' : 'Tela cheia'}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/25 text-white/70 backdrop-blur-md transition hover:bg-white/15 hover:text-white"
      >
        {telaCheia ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
      </button>
    </div>
    </div>
    </NavegacaoContext.Provider>
  );
};

interface FolhaProps {
  x: number;
  origem: 'left' | 'right';
  de: number;
  ate: number;
  frente: ReactNode;
  verso: ReactNode;
  onFim: () => void;
}

// A folha que gira. A sombra escurece a face conforme ela fica de lado.
const Folha = ({ x, origem, de, ate, frente, verso, onFim }: FolhaProps) => (
  <motion.div
    className="em-leaf"
    style={{ left: x, transformOrigin: `${origem} center` }}
    initial={{ rotateY: de }}
    animate={{ rotateY: ate }}
    transition={{ duration: DURACAO, ease: EASE }}
    onAnimationComplete={onFim}
  >
    <div className="em-face">
      {frente}
      <motion.div
        className="em-shade"
        style={{ background: `linear-gradient(to ${origem === 'left' ? 'left' : 'right'}, rgba(0,0,0,0.35), transparent 70%)` }}
        initial={{ opacity: de === 0 ? 0 : 1 }}
        animate={{ opacity: de === 0 ? 1 : 0 }}
        transition={{ duration: DURACAO, ease: EASE }}
      />
    </div>
    <div className="em-face em-face--verso">
      {verso}
      <motion.div
        className="em-shade"
        style={{ background: `linear-gradient(to ${origem === 'left' ? 'right' : 'left'}, rgba(0,0,0,0.35), transparent 70%)` }}
        initial={{ opacity: de === 0 ? 1 : 0 }}
        animate={{ opacity: de === 0 ? 0 : 1 }}
        transition={{ duration: DURACAO, ease: EASE }}
      />
    </div>
  </motion.div>
);

export { PAGINA_L, PAGINA_A };
export default Revista;
