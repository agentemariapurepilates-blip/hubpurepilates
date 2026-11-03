import type { ReactNode } from 'react';

// Peças da Edição 2, as mesmas da Edição 1: título com fio, itens numerados com fio
// (como a estrutura do Suporte) e bloco vinho de fecho.

export const TituloComFio = ({ children, tamanho = 84 }: { children: ReactNode; tamanho?: number }) => (
  <h2
    className="em-display border-b-2 border-[var(--em-tinta)] pb-[16px] font-extrabold uppercase leading-[0.88] tracking-[-0.01em]"
    style={{ fontSize: tamanho }}
  >
    {children}
  </h2>
);

export const Item = ({ n, titulo, rotulo, children }: { n: string; titulo: ReactNode; rotulo?: string; children?: ReactNode }) => (
  <div className="flex gap-[24px] border-b border-[var(--em-tinta)]/20 py-[13px]">
    <div className="em-display w-[66px] shrink-0 text-[60px] font-extrabold leading-[0.95] text-[var(--em-vinho)]">{n}</div>
    <div className="min-w-0 flex-1">
      <div className="em-display text-[32px] font-extrabold uppercase leading-[0.98]">{titulo}</div>
      {rotulo && <div className="em-sans mt-[3px] text-[12.5px] font-bold uppercase tracking-[0.22em] text-[var(--em-vinho)]">{rotulo}</div>}
      {children && <p className="em-sans mt-[5px] text-[16px] leading-[1.42]">{children}</p>}
    </div>
  </div>
);

/** Intertítulo com fio vinho à esquerda, como em "Onde encontrar?" na Edição 1. */
export const Lateral = ({ rotulo, titulo, children }: { rotulo: string; titulo?: string; children: ReactNode }) => (
  <div className="border-l-[3px] border-[var(--em-vinho)] pl-[14px]">
    <div className="em-sans text-[12.5px] font-bold uppercase tracking-[0.22em] text-[var(--em-vinho)]">{rotulo}</div>
    {titulo && <div className="em-display mt-[3px] text-[30px] font-extrabold uppercase leading-[0.98]">{titulo}</div>}
    <p className="em-sans mt-[4px] text-[15.5px] leading-[1.42]">{children}</p>
  </div>
);

export const BlocoVinho = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={`em-tom--vinho px-[26px] py-[18px] ${className ?? ''}`}>{children}</div>
);

/** Frase-chave: serifa itálica um degrau acima do texto, com fio vinho. */
export const Chave = ({ children, className }: { children: ReactNode; className?: string }) => (
  <blockquote className={`em-serif border-l-[3px] border-[var(--em-vinho)] pl-[22px] text-[24px] italic leading-[1.38] text-[var(--em-vinho)] ${className ?? ''}`}>
    {children}
  </blockquote>
);

/** Intertítulo: sem caixa-alta (caixa-alta é só do título), um degrau acima do texto. */
export const Intertitulo = ({ children, className }: { children: ReactNode; className?: string }) => (
  <h3 className={`em-sans text-[22px] font-bold leading-[1.25] text-[var(--em-vinho)] ${className ?? ''}`}>{children}</h3>
);
