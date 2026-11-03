import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Pagina, type Lado } from '../diagramacao';
import { MATERIAS } from './materias';

// Os looks da Coleção Move em mosaico. Passar o mouse dá zoom no look; clicar (ou tocar,
// no celular) abre a imagem inteira por cima da revista, com setas e Esc para fechar.

const LOOKS = Object.values(
  import.meta.glob<string>('./fotos/looks/*.jpg', { eager: true, import: 'default' }),
);

// clique e arraste aqui não podem virar a página
const segura = (e: React.SyntheticEvent) => e.stopPropagation();

const Ampliada = ({ i, onFechar, onIr }: { i: number; onFechar: () => void; onIr: (i: number) => void }) => {
  useEffect(() => {
    // na fase de captura, para a revista não virar a página com as setas
    const tecla = (e: KeyboardEvent) => {
      if (!['Escape', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      e.stopPropagation();
      e.preventDefault();
      if (e.key === 'Escape') onFechar();
      if (e.key === 'ArrowLeft') onIr((i - 1 + LOOKS.length) % LOOKS.length);
      if (e.key === 'ArrowRight') onIr((i + 1) % LOOKS.length);
    };
    window.addEventListener('keydown', tecla, true);
    return () => window.removeEventListener('keydown', tecla, true);
  }, [i, onFechar, onIr]);

  const seta = 'em-sans absolute top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-3xl text-white hover:bg-white/30';
  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4"
      onPointerDown={segura}
      onPointerUp={segura}
      onClick={(e) => {
        e.stopPropagation();
        onFechar();
      }}
    >
      <img
        src={LOOKS[i]}
        alt={`Look ${i + 1} da Coleção Move`}
        className="max-h-[92vh] max-w-[92vw] object-contain shadow-2xl"
        onClick={segura}
      />
      <button type="button" aria-label="Look anterior" className={`${seta} left-4`} onClick={(e) => { e.stopPropagation(); onIr((i - 1 + LOOKS.length) % LOOKS.length); }}>‹</button>
      <button type="button" aria-label="Próximo look" className={`${seta} right-4`} onClick={(e) => { e.stopPropagation(); onIr((i + 1) % LOOKS.length); }}>›</button>
      <button type="button" aria-label="Fechar" className="em-sans absolute right-4 top-4 text-[15px] font-semibold text-white/80 hover:text-white" onClick={(e) => { e.stopPropagation(); onFechar(); }}>
        Fechar ✕
      </button>
      <div className="em-sans absolute bottom-4 left-1/2 -translate-x-1/2 text-[14px] text-white/70">{i + 1} de {LOOKS.length}</div>
    </div>,
    document.body,
  );
};

// Duas páginas de looks, 6 em cada; o clique em qualquer um amplia e passa por todos.
const Mosaico = ({ lado, parte }: { lado: Lado; parte: 0 | 1 }) => {
  const [aberto, setAberto] = useState<number | null>(null);
  const daPagina = LOOKS.slice(parte * 6, parte * 6 + 6);
  return (
    <Pagina lado={lado} numero={MATERIAS.move.pagina + 2 + parte}>
      {parte === 0 && (
        <div className="absolute inset-x-[64px] top-[84px]">
          <div className="em-sans text-[15px] font-semibold text-[var(--em-vinho)]">Coleção Move</div>
          <h2 className="em-display mt-[8px] text-[64px] font-extrabold uppercase leading-[0.9]">Os looks</h2>
          <p className="em-sans mt-[8px] text-[16px] opacity-75">Toque numa foto para ver o look inteiro.</p>
        </div>
      )}
      <div className={`absolute inset-x-[64px] grid grid-cols-3 gap-[10px] ${parte === 0 ? 'top-[250px]' : 'top-[96px]'}`}>
        {daPagina.map((src, k) => {
          const i = parte * 6 + k;
          return (
            <button
              key={src}
              type="button"
              onPointerDown={segura}
              onPointerUp={segura}
              onClick={(e) => {
                e.stopPropagation();
                setAberto(i);
              }}
              // ao passar o mouse o look cresce por cima dos vizinhos, sem sair da página:
              // cada foto cresce para dentro da página, a partir do seu canto
              className={`relative aspect-[3/4] overflow-hidden bg-[#e9dfd1] transition-[transform,box-shadow] duration-300 ease-out hover:z-20 hover:scale-[1.75] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.55)] ${
                ['origin-top-left', 'origin-top', 'origin-top-right', 'origin-bottom-left', 'origin-bottom', 'origin-bottom-right'][k]
              }`}
              aria-label={`Ampliar o look ${i + 1}`}
            >
              <img src={src} alt="" draggable={false} className="h-full w-full select-none object-cover" />
            </button>
          );
        })}
      </div>
      {aberto !== null && <Ampliada i={aberto} onFechar={() => setAberto(null)} onIr={setAberto} />}
    </Pagina>
  );
};

export const StoreLooks = ({ lado }: { lado: Lado }) => <Mosaico lado={lado} parte={0} />;
export const StoreLooks2 = ({ lado }: { lado: Lado }) => <Mosaico lado={lado} parte={1} />;
