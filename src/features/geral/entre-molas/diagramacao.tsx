import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ImageIcon, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

// Peças de diagramação comuns às páginas da revista (todas em 820 × 1000).

export type Lado = 'esquerda' | 'direita' | 'solta';

/** Deixa o sumário (e qualquer página) levar o leitor a outra página. */
export const NavegacaoContext = createContext<{ irParaPagina: (pagina: number) => void }>({
  irParaPagina: () => {},
});
export const useNavegacao = () => useContext(NavegacaoContext);

/** Editoria da página (ex.: "Carta do CEO") e a posição dela dentro da matéria: mostra onde a matéria começa e termina. */
export const EditoriaContext = createContext<{ nome: string; i: number; n: number } | null>(null);

interface PaginaProps {
  lado: Lado;
  numero?: number;
  /** Página "de cor" (vinho, escura): troca papel e tinta. */
  tom?: 'papel' | 'vinho' | 'escuro';
  semFolio?: boolean;
  /** Fólio só com o número (quando uma foto ocupa o rodapé da página). */
  folioCurto?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

export const Pagina = ({ lado, numero, tom = 'papel', semFolio, folioCurto, className, style, children }: PaginaProps) => {
  const editoria = useContext(EditoriaContext);
  return (
  <div
    className={cn('em-page', `em-page--${lado}`, `em-tom--${tom}`, className)}
    style={style}
  >
    <div className="em-grao" />
    {children}
    {editoria && !semFolio && (
      <div
        className={cn(
          'em-sans absolute top-[18px] z-20 flex items-center gap-[8px] px-[10px] py-[5px] text-[13px] font-bold uppercase tracking-[0.2em] shadow-[0_2px_10px_rgba(0,0,0,0.25)]',
          // em página vinho, a etiqueta inverte (creme com letra vinho) para não sumir no fundo
          tom === 'vinho' ? 'bg-[#f7ecdc] text-[#a9293b]' : 'bg-[#a9293b] text-[#f7ecdc]',
          lado === 'esquerda' ? 'left-0 pl-[64px]' : 'right-0 pr-[64px]',
        )}
      >
        <span>{editoria.nome}</span>
        {editoria.n > 1 && <span className="opacity-70">{editoria.i}/{editoria.n}</span>}
      </div>
    )}
    {!semFolio && numero !== undefined && (
      <div
        className={cn(
          'em-sans absolute bottom-[34px] flex items-center gap-[14px] text-[14px] font-semibold uppercase tracking-[0.32em] opacity-70',
          lado === 'esquerda' ? 'left-[64px]' : 'right-[64px] flex-row-reverse',
        )}
      >
        <span className="text-[17px] tracking-[0.08em]">{String(numero).padStart(2, '0')}</span>
        {!folioCurto && (
          <>
            <span className="h-px w-[28px] bg-current" />
            <span>Entre Molas · Edição 1</span>
          </>
        )}
      </div>
    )}
  </div>
  );
};

/**
 * Espaço para foto. Sem `src`, mostra um quadro marcado, esperando a imagem.
 * Com `legenda`, a legenda aparece numa faixa na base da foto.
 */
export const Foto = ({
  src,
  alt = '',
  className,
  posicao = 'center',
  legenda,
}: {
  src?: string;
  alt?: string;
  className?: string;
  posicao?: string;
  legenda?: ReactNode;
}) => {
  if (!src) {
    return (
      <div className={cn('em-foto-vazia flex items-center justify-center', className)}>
        <ImageIcon className="h-[44px] w-[44px] opacity-30" strokeWidth={1.2} />
      </div>
    );
  }
  if (!legenda) {
    return (
      <img src={src} alt={alt} draggable={false} className={cn('select-none object-cover', className)} style={{ objectPosition: posicao }} />
    );
  }
  return (
    <figure className={cn('overflow-hidden', className)}>
      <img src={src} alt={alt} draggable={false} className="h-full w-full select-none object-cover" style={{ objectPosition: posicao }} />
      <figcaption className="em-sans absolute inset-x-0 bottom-0 flex items-center gap-[12px] bg-gradient-to-t from-black/80 via-black/55 to-transparent px-[28px] pb-[14px] pt-[40px] text-[15px] font-semibold uppercase tracking-[0.16em] text-[#f7ecdc]">
        <span className="h-[2px] w-[24px] shrink-0 bg-[#e0566b]" />
        {legenda}
      </figcaption>
    </figure>
  );
};

/**
 * Vídeo que toca sozinho e em loop, servido pelo próprio Hub (nada de player do
 * Drive). Começa mudo — é o que o navegador permite. Com `somAoAbrir`, liga o
 * som logo depois que a página assenta (a pessoa acabou de clicar para virar,
 * então o navegador costuma deixar); se não deixar, o botão grande no centro liga.
 * Os botões de som nunca ficam nos cantos da página: ali o clique vira a folha.
 */
export const VideoAuto = ({
  src,
  poster,
  className,
  inteiro = false,
  somAoAbrir = false,
  somNoCentro = false,
  posicao,
}: {
  src: string;
  poster?: string;
  className?: string;
  /** Mostra o vídeo inteiro (sem cortar as bordas), em vez de preencher o quadro. */
  inteiro?: boolean;
  somAoAbrir?: boolean;
  /** Com o som ligado, o botão de tirar o som fica bem no centro do vídeo (o padrão é no centro da base). */
  somNoCentro?: boolean;
  /** Que parte do vídeo fica à vista quando ele é cortado para preencher o quadro (ex.: '50% 20%'). */
  posicao?: string;
}) => {
  const ref = useRef<HTMLVideoElement>(null);
  const [mudo, setMudo] = useState(true);

  const ligarSom = () => {
    const v = ref.current;
    if (!v) return;
    v.muted = false;
    v.play()
      .then(() => setMudo(false))
      .catch(() => {
        v.muted = true;
        setMudo(true);
      });
  };

  // ao chegar na página o vídeo sempre começa do início (a página é montada de
  // novo a cada visita, então sair e voltar também recomeça)
  useEffect(() => {
    if (ref.current) ref.current.currentTime = 0;
  }, []);

  useEffect(() => {
    if (!somAoAbrir) return;
    // espera a virada terminar: a cópia da página na folha que gira já saiu
    const t = setTimeout(ligarSom, 1100);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [somAoAbrir]);

  // clique no botão não pode virar a página nem contar como arraste
  const segura = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <div className={cn('overflow-hidden bg-black', className)}>
      <video
        ref={ref}
        src={src}
        poster={poster}
        autoPlay
        muted={mudo}
        loop
        playsInline
        preload="metadata"
        className={cn('h-full w-full', inteiro ? 'object-contain' : 'object-cover')}
        style={posicao ? { objectPosition: posicao } : undefined}
      />
      {mudo ? (
        <button
          type="button"
          onPointerDown={segura}
          onPointerUp={segura}
          onClick={(e) => {
            e.stopPropagation();
            ligarSom();
          }}
          aria-label="Ativar som"
          className="em-sans absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-[14px] whitespace-nowrap rounded-full bg-black/65 px-[34px] py-[20px] text-[22px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur transition hover:scale-105 hover:bg-black/80"
        >
          <VolumeX className="h-[30px] w-[30px]" />
          Ativar som
        </button>
      ) : (
        <button
          type="button"
          onPointerDown={segura}
          onPointerUp={segura}
          onClick={(e) => {
            e.stopPropagation();
            if (ref.current) ref.current.muted = true;
            setMudo(true);
          }}
          aria-label="Tirar som"
          className={cn(
            'absolute left-1/2 flex -translate-x-1/2 items-center justify-center rounded-full text-white backdrop-blur transition hover:bg-black/80',
            // nunca nos cantos: é ali que a página vira
            somNoCentro
              ? 'top-1/2 h-[72px] w-[72px] -translate-y-1/2 bg-black/35 opacity-75 hover:opacity-100'
              : 'bottom-[16px] h-[52px] w-[52px] bg-black/55',
          )}
        >
          <Volume2 className={somNoCentro ? 'h-[32px] w-[32px]' : 'h-[24px] w-[24px]'} />
        </button>
      )}
    </div>
  );
};

/**
 * Área útil da página em FLUXO (coluna flex): os blocos se empilham e nunca se sobrepõem; uma foto com
 * `min-h-0 flex-1` ocupa o que sobrar. Use `-mx-[64px]` num filho para sangrar até as bordas da página.
 */
export const Miolo = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('absolute inset-x-[64px] bottom-[84px] top-[64px] flex flex-col', className)}>{children}</div>
);

/** Rótulo pequeno em caixa-alta (os intertítulos do Canva). */
export const Rotulo = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('em-sans text-[16px] font-bold uppercase tracking-[0.22em] text-[var(--em-vinho)]', className)}>
    {children}
  </div>
);

export const Titulo = ({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) => (
  <h2 className={cn('em-display font-bold uppercase leading-[0.9] tracking-[-0.01em]', className)} style={style}>
    {children}
  </h2>
);

/** Texto corrido em colunas, justificado, com capitular opcional. */
export const Corpo = ({
  children,
  colunas = 2,
  capitular,
  className,
}: {
  children: ReactNode;
  colunas?: 1 | 2;
  capitular?: boolean;
  className?: string;
}) => (
  <div
    className={cn('em-corpo', colunas === 2 && 'em-corpo--2', capitular && 'em-corpo--capitular', className)}
  >
    {children}
  </div>
);

/** Citação em destaque. As aspas vêm no próprio texto, como no Canva. */
export const Citacao = ({
  children,
  autor,
  className,
  tamanho = 40,
}: {
  children: ReactNode;
  autor?: ReactNode;
  className?: string;
  tamanho?: number;
}) => (
  <figure className={cn('relative', className)}>
    <div className="mb-[22px] h-[4px] w-[56px] bg-[var(--em-vinho)]" />
    <blockquote className="em-display font-medium leading-[1.05] text-current" style={{ fontSize: tamanho }}>
      {children}
    </blockquote>
    {autor && (
      <figcaption className="em-sans mt-[18px] text-[15px] font-semibold uppercase tracking-[0.18em] text-[var(--em-vinho)]">
        {autor}
      </figcaption>
    )}
  </figure>
);
