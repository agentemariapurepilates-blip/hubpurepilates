import type { MouseEvent, PointerEvent, ReactNode } from 'react';
import logoCreme from '../assets/logo-entre-molas-creme.png';
import { useNavegacao } from '../diagramacao';
import iconeGpt from './fotos/icone-gpt.png';
import { MATERIAS, PURE_GPT, RECONHECIMENTO } from './materias';

// Capa da Edição especial, recriada do rascunho do time (nota.png, 19/11/2026):
// vinho, duas chamadas pequenas no topo, o logo, "NOTA" e "FISCAL" em letra
// condensada bem alta, em degrau, a linha de apoio e o Pure GPT embaixo.
// O ícone do Pure GPT foi recortado do próprio rascunho (revista interna).
//
// REGRA DA REVISTA: nada encosta no rodapé. Texto e imagem ficam a pelo menos
// MARGEM_DO_RODAPE da borda de baixo (o mesmo respiro da área útil das páginas).
const MARGEM_DO_RODAPE = 112;

// Paleta Pure Studio: o vinho de base e três apoios (turquesa, laranja, grafite).
const TURQUESA = '#23b2ba';
const LARANJA = '#db9828';
const GRAFITE = '#231f20';

/** Palavra em condensada esticada para o alto (como no rascunho). */
const Alta = ({ children, tamanho }: { children: ReactNode; tamanho: number }) => (
  <span
    className="em-display block font-bold uppercase text-white"
    style={{ fontSize: tamanho, lineHeight: 0.8, transform: 'scaleY(1.55)', transformOrigin: 'top left', letterSpacing: '-0.035em' }}
  >
    {children}
  </span>
);

/** Cupom de nota fiscal em traço, atrás da manchete (borda de baixo serrilhada). */
const CupomEmTraco = () => {
  const dentes = 10;
  const w = 300;
  const h = 400;
  let borda = `M 12 0 H ${w - 12} Q ${w} 0 ${w} 12 V ${h - 20}`;
  for (let i = dentes; i > 0; i--) {
    const x1 = (w / dentes) * (i - 0.5);
    const x2 = (w / dentes) * (i - 1);
    borda += ` L ${x1.toFixed(1)} ${h} L ${x2.toFixed(1)} ${h - 20}`;
  }
  borda += ' V 12 Q 0 0 12 0 Z';
  return (
    <svg viewBox={`-6 -6 ${w + 12} ${h + 12}`} className="h-full w-full" aria-hidden="true">
      <path d={borda} fill="none" stroke="#ffffff" strokeWidth="7" strokeLinejoin="round" />
      {[60, 100, 140].map((y, i) => (
        <line key={y} x1="44" y1={y} x2={i === 1 ? 190 : 256} y2={y} stroke="#ffffff" strokeWidth="9" strokeLinecap="round" />
      ))}
      <line x1="44" y1="196" x2="256" y2="196" stroke="#ffffff" strokeWidth="4" strokeDasharray="10 10" />
      <line x1="44" y1="244" x2="150" y2="244" stroke="#ffffff" strokeWidth="9" strokeLinecap="round" />
      <line x1="44" y1="284" x2="120" y2="284" stroke="#ffffff" strokeWidth="9" strokeLinecap="round" />
      <rect x="186" y="232" width="70" height="70" rx="6" fill="none" stroke="#ffffff" strokeWidth="7" />
      <rect x="204" y="250" width="34" height="34" fill="#ffffff" />
    </svg>
  );
};

const Capa = () => {
  const { irParaPagina } = useNavegacao();
  const segura = (e: PointerEvent) => e.stopPropagation();
  const ir = (n: number) => (e: MouseEvent) => {
    e.stopPropagation();
    irParaPagina(n);
  };
  const botao = { type: 'button' as const, onPointerDown: segura, onPointerUp: segura };

  return (
    <div className="em-page em-page--solta overflow-hidden" style={{ background: '#a9293b', color: '#ffffff' }}>
      {/* chamadas do topo */}
      <div className="em-sans absolute left-[96px] right-[60px] top-[44px] grid grid-cols-2 items-start gap-[50px] text-[16px] leading-[1.25]">
        <button {...botao} onClick={ir(PURE_GPT.pagina)} className="block text-left">
          <span className="mb-[8px] block h-[6px] w-[34px]" style={{ background: TURQUESA }} />
          <b className="font-semibold">PURE GPT:</b> Um sistema único para os franqueados que desejam mais autonomia na hora de criar suas artes
        </button>
        <button {...botao} onClick={ir(RECONHECIMENTO.pagina)} className="block text-left">
          <span className="mb-[8px] block h-[6px] w-[34px]" style={{ background: LARANJA }} />
          <b className="font-semibold">REPUTAÇÃO:</b> Nossa nota melhorou no Reclame Aqui. O CUIDADO QUE APARECE e reflete nosso atendimento.
        </button>
      </div>

      {/* logo */}
      <img
        src={logoCreme}
        alt="Entre Molas — Você por dentro de tudo."
        draggable={false}
        className="absolute left-[46px] top-[158px] z-10 w-[740px] max-w-none select-none"
      />

      {/* pontilhado laranja (grafismo da marca) */}
      <svg aria-hidden="true" width="150" height="66" viewBox="0 0 150 66" className="absolute right-[48px]" style={{ bottom: MARGEM_DO_RODAPE }}>
        {Array.from({ length: 18 }, (_, i) => (
          <circle key={i} cx={10 + (i % 6) * 26} cy={10 + Math.floor(i / 6) * 22} r="4.5" fill={LARANJA} />
        ))}
      </svg>

      {/* cupom de nota fiscal atrás da manchete */}
      <div className="absolute left-[262px] top-[336px] h-[380px] w-[300px] opacity-[0.1]" style={{ rotate: '9deg' }}>
        <CupomEmTraco />
      </div>

      {/* NOTA / FISCAL em degrau */}
      <button {...botao} onClick={ir(MATERIAS.editorial.pagina)} className="absolute left-[124px] top-[326px] text-left" style={{ rotate: '-2deg' }}>
        <Alta tamanho={150}>Nota</Alta>
      </button>
      <button {...botao} onClick={ir(MATERIAS.editorial.pagina)} className="absolute left-[362px] top-[462px] text-left" style={{ rotate: '-2deg' }}>
        <Alta tamanho={150}>Fiscal</Alta>
      </button>

      {/* linha de apoio */}
      <div className="em-sans absolute left-[284px] top-[722px] text-[22px] leading-[1.4]">
        <p className="font-normal">Agora o sistema é outro.</p>
        <p className="mt-[8px] inline-block px-[12px] py-[5px] font-semibold" style={{ background: LARANJA, color: GRAFITE }}>
          E você precisa saber o que mudou!
        </p>
      </div>

      {/* Pure GPT embaixo */}
      <button {...botao} onClick={ir(PURE_GPT.pagina)} className="absolute left-[60px] text-left" style={{ bottom: MARGEM_DO_RODAPE }}>
        <span className="ml-[62px] flex h-[78px] w-[78px] items-center justify-center rounded-full" style={{ background: GRAFITE }}>
          <img src={iconeGpt} alt="" draggable={false} className="h-[50px] w-[50px] select-none" />
        </span>
        <span className="em-sans mt-[22px] block text-[20px] font-bold uppercase leading-[1.2]">
          Você pediu, a Pure
          <br />
          atendeu: Pure GPT
        </span>
      </button>
    </div>
  );
};

export default Capa;
