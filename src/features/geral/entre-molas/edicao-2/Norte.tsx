import { Miolo, Pagina, type Lado } from '../diagramacao';
import { CINZA, Mapa, REGIOES, VERMELHO } from '../edicao-1/Territorio';
import { MATERIAS } from './materias';
import { BlocoVinho, TituloComFio } from './pecas';

// Campanha do Norte (páginas 26 e 27). O mapa é o mesmo da Edição 1; textos
// exatamente como na arte do Canva.

const P = MATERIAS.norte.pagina;

export const Norte1 = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P} tom="vinho">
    <Miolo>
      <div className="h-[4px] w-[64px] bg-[#f7ecdc]" />
      <div className="em-sans mt-[22px] text-[15px] font-bold uppercase tracking-[0.3em]">Pure Franchising</div>
      <h2 className="em-display mt-[22px] text-[220px] font-extrabold uppercase leading-[0.82] tracking-[-0.01em]">Leve a Pure</h2>
      <p className="em-display mt-[22px] text-[74px] font-bold uppercase leading-[0.92] text-[#ffd9a8]">para novos horizontes.</p>
      {/* do ponto ao horizonte: a linha pontilhada, o avião e o sol */}
      <svg viewBox="0 0 690 220" className="mt-auto w-full" aria-hidden="true">
        <line x1="0" y1="170" x2="690" y2="170" stroke="#f7ecdc" strokeWidth="2.5" />
        <path d="M480 170 A85 85 0 0 1 650 170 Z" fill="#ffd9a8" />
        <circle cx="30" cy="200" r="8" fill="#f7ecdc" />
        <path d="M30 200 C120 170 110 120 240 112 C340 106 330 34 450 34" fill="none" stroke="#f7ecdc" strokeWidth="4" strokeDasharray="1 11" strokeLinecap="round" />
        <path d="M478 40 L540 8 L516 70 L502 50 Z" fill="#a9293b" stroke="#f7ecdc" strokeWidth="3" strokeLinejoin="round" />
      </svg>
      <p className="em-serif mt-[16px] text-[24px]">Todo horizonte começa com um ponto.</p>
    </Miolo>
  </Pagina>
);

const NUMEROS = [
  { n: '16', t: 'UFs com Pure', d: '15 estados + DF' },
  { n: '11', t: 'UFs sem Pure', d: 'o próximo território' },
  { n: '0 de 7', t: 'no Norte', d: 'região em aberto' },
];

export const Norte2 = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P + 1}>
    <Miolo>
      <TituloComFio tamanho={60}>
        Presente em 16 das 27 UFs.<br />
        <span className="text-[var(--em-vinho)]">O Norte é horizonte.</span>
      </TituloComFio>
      <div className="relative mt-[10px] min-h-0 flex-1">
        <div className="absolute inset-0"><Mapa /></div>
      </div>
      <div className="mt-[8px] grid grid-cols-3 gap-[20px] border-y border-[var(--em-tinta)]/20 py-[12px]">
        {NUMEROS.map((x) => (
          <div key={x.t}>
            <div className="em-display text-[58px] font-extrabold leading-none text-[var(--em-vinho)]">{x.n}</div>
            <div className="em-display mt-[2px] text-[23px] font-bold uppercase leading-none">{x.t}</div>
            <div className="em-sans mt-[2px] text-[13px] opacity-70">{x.d}</div>
          </div>
        ))}
      </div>
      <div className="em-sans mt-[10px] space-y-[4px]">
        {REGIOES.map((r) => (
          <div key={r.nome} className="flex items-center gap-[14px]">
            <span className="em-display w-[130px] text-[20px] font-bold uppercase leading-none">{r.nome}</span>
            <span className="flex flex-1 gap-[5px]">
              {Array.from({ length: r.total }, (_, i) => (
                <span key={i} className="h-[13px] w-[13px] rounded-full" style={{ background: i < r.com ? VERMELHO : CINZA }} />
              ))}
            </span>
            <span className="text-[14px] opacity-70">{r.com} de {r.total}</span>
          </div>
        ))}
      </div>
      <BlocoVinho className="mt-[12px] !py-[12px]">
        <p className="em-display text-[24px] font-bold uppercase leading-none">Consulte as praças disponíveis · link na bio</p>
      </BlocoVinho>
    </Miolo>
  </Pagina>
);
