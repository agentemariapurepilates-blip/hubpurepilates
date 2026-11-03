import { useEffect, useState } from 'react';
import { Miolo, Pagina, type Lado } from '../diagramacao';
import { CINZA, Mapa, REGIOES, VERMELHO } from '../edicao-1/Territorio';
import { MATERIAS } from './materias';
import { Chave, TituloComFio } from './pecas';

// Expansão (páginas 12 e 13). A abertura vem logo depois do artigo, numa página da
// direita: o +500 conta na hora em que a página abre, a arte "Leve a Pure" e o mapa
// com os aviões de papel indo para os estados ainda sem Pure (o mesmo da Edição 1).
// A segunda página traz os números e as regiões.

const P = MATERIAS.norte.pagina;

/** Conta de 0 até o número quando a página aparece (espera a virada da folha). */
const useContagem = (ate: number, duracao = 2200, espera = 900) => {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t = setTimeout(() => {
      const inicio = performance.now();
      const passo = (agora: number) => {
        const p = Math.min(1, (agora - inicio) / duracao);
        setN(Math.round(ate * (1 - (1 - p) ** 3)));
        if (p < 1) raf = requestAnimationFrame(passo);
      };
      raf = requestAnimationFrame(passo);
    }, espera);
    return () => {
      clearTimeout(t);
      cancelAnimationFrame(raf);
    };
  }, [ate, duracao, espera]);
  return n;
};

export const Norte1 = ({ lado }: { lado: Lado }) => {
  const n = useContagem(500);
  return (
    <Pagina lado={lado} numero={P}>
      <div className="absolute inset-x-[64px] top-[70px]">
        <div className="em-sans text-[15px] font-semibold text-[var(--em-vinho)]">Pure Franchising</div>
        <p className="em-serif mt-[14px] text-[30px] italic leading-none">Já temos mais de</p>
        <div className="mt-[4px] flex items-end gap-[24px]">
          <span className="em-display text-[200px] font-extrabold leading-[0.8] tracking-[-0.02em] text-[var(--em-vinho)] tabular-nums">
            +{n}
          </span>
          <span className="em-display pb-[10px] text-[60px] font-extrabold uppercase leading-[0.9]">
            unidades
            <br />
            assinadas.
          </span>
        </div>
      </div>

      {/* a arte "Leve a Pure" à esquerda e o mapa com os aviões à direita */}
      <div className="absolute left-[64px] top-[360px] w-[250px]">
        <div className="h-[4px] w-[48px] bg-[var(--em-vinho)]" />
        <p className="em-display mt-[18px] text-[78px] font-extrabold uppercase leading-[0.84]">Leve a Pure</p>
        <p className="em-serif mt-[12px] text-[26px] italic leading-[1.2] text-[var(--em-vinho)]">para novos horizontes.</p>
        <svg viewBox="0 0 250 120" className="mt-[26px] w-full" aria-hidden="true">
          <line x1="0" y1="96" x2="250" y2="96" stroke="#221613" strokeWidth="2" />
          <path d="M160 96 A48 48 0 0 1 250 96 Z" fill="#a9293b" />
          <circle cx="10" cy="112" r="6" fill="#221613" />
          <path d="M10 112 C60 96 50 60 110 58 C160 56 150 18 200 18" fill="none" stroke="#221613" strokeWidth="3" strokeDasharray="1 9" strokeLinecap="round" />
        </svg>
        <p className="em-sans mt-[14px] text-[16px] leading-[1.4] opacity-80">Todo horizonte começa com um ponto.</p>
      </div>
      <div className="absolute right-[24px] top-[330px] h-[520px] w-[480px]">
        <Mapa />
      </div>
    </Pagina>
  );
};

const NUMEROS = [
  { n: '16', t: 'UFs com Pure', d: '15 estados + DF' },
  { n: '11', t: 'UFs sem Pure', d: 'o próximo território' },
  { n: '0 de 7', t: 'no Norte', d: 'região em aberto' },
];

export const Norte2 = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P + 1}>
    <Miolo className="!top-[96px] justify-between">
      <TituloComFio tamanho={64}>
        Presente em 16 das 27 UFs.<br />
        <span className="text-[var(--em-vinho)]">O Norte é horizonte.</span>
      </TituloComFio>
      <div className="grid grid-cols-3 gap-[24px]">
        {NUMEROS.map((x) => (
          <div key={x.t}>
            <div className="em-display text-[84px] font-extrabold leading-none text-[var(--em-vinho)]">{x.n}</div>
            <div className="em-sans mt-[8px] text-[19px] font-bold">{x.t}</div>
            <div className="em-sans mt-[2px] text-[15px] opacity-70">{x.d}</div>
          </div>
        ))}
      </div>
      <div>
      <div className="em-sans text-[15px] font-semibold text-[var(--em-vinho)]">Presença por região</div>
      <div className="em-sans mt-[18px] space-y-[20px]">
        {REGIOES.map((r) => (
          <div key={r.nome} className="flex items-center gap-[16px]">
            <span className="w-[140px] text-[18px] font-semibold">{r.nome}</span>
            <span className="flex flex-1 gap-[6px]">
              {Array.from({ length: r.total }, (_, i) => (
                <span key={i} className="h-[20px] w-[20px] rounded-full" style={{ background: i < r.com ? VERMELHO : CINZA }} />
              ))}
            </span>
            <span className="text-[15px] opacity-70">{r.com} de {r.total}</span>
          </div>
        ))}
      </div>
      </div>
      <Chave className="mb-[40px]">Consulte as praças disponíveis: link na bio.</Chave>
    </Miolo>
  </Pagina>
);
