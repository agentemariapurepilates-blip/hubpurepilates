import { Miolo, Pagina, type Lado } from '../diagramacao';
import { ESTADOS_BR, MAPA_BR_ALTURA } from '../mapaBrasil';
import { MATERIAS } from './materias';

// O território — continuação de "Somos a segunda maior do mundo" (a frase-título do mapa saiu a pedido da equipe). A arte do território refeita direto na página: mapa em vetor, cartões e barras são
// formas e texto, não imagem. Textos e números exatamente como na arte.

const COM_PURE = new Set(['CE', 'RN', 'PB', 'PE', 'AL', 'SE', 'BA', 'GO', 'DF', 'MG', 'ES', 'RJ', 'SP', 'PR', 'SC', 'RS']);

// Siglas escritas dentro do estado; as dos estados pequenos do litoral vão para fora, com um fio.
const FORA: Record<string, [number, number]> = {
  RN: [1000, 268], PB: [1012, 306], PE: [1012, 340], AL: [1000, 374], SE: [978, 408], ES: [900, 668], RJ: [846, 742], DF: [716, 520],
};
const SEM_ROTULO = new Set<string>(['DF']);

const REGIOES = [
  { nome: 'Norte', com: 0, total: 7 },
  { nome: 'Nordeste', com: 7, total: 9 },
  { nome: 'Centro-Oeste', com: 2, total: 4 },
  { nome: 'Sudeste', com: 4, total: 4 },
  { nome: 'Sul', com: 3, total: 3 },
];

// Rotas dos aviões de papel: saem de São Paulo, onde tudo começou, e vão para cada estado ainda sem Pure. Curvas leves, para os
// aviões não voarem em linha reta nem uns por cima dos outros.
const ORIGEM: [number, number] = ESTADOS_BR.SP.c;
const DESTINOS = ['PA', 'MT', 'TO', 'MA', 'AM', 'MS', 'PI', 'RO', 'AP', 'AC', 'RR'];
// Um laço de 14,5 s: um avião decola a cada 0,9 s, voa 2,8 s e, ao pousar, o estado fica vermelho; com todos
// pousados o mapa fica inteiro vermelho por um instante e tudo recomeça.
const CICLO = 14.5;
const INTERVALO = 0.9;
const VOO = 2.8;
const ROTAS = DESTINOS.map((uf, i) => {
  const [x, y] = ESTADOS_BR[uf].c;
  const [ox, oy] = ORIGEM;
  const curva = (i % 2 ? -1 : 1) * 0.16;
  const cx = (ox + x) / 2 - (y - oy) * curva;
  const cy = (oy + y) / 2 + (x - ox) * curva;
  // momentos do laço (fração de 0 a 1): quando o avião decola e quando pousa
  const decola = (0.3 + i * INTERVALO) / CICLO;
  const pousa = decola + VOO / CICLO;
  return { uf, x, y, decola, pousa, d: `M${ox} ${oy} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x} ${y}` };
});
const ROTA_DE = new Map(ROTAS.map((r) => [r.uf, r]));
const FIM = 0.94; // o mapa fica todo vermelho até aqui; depois apaga e o laço recomeça
const f = (n: number) => n.toFixed(4);
const LACO = { dur: `${CICLO}s`, repeatCount: 'indefinite' } as const;

const VERMELHO = '#c12030';
const CINZA = '#d3cdc4';

const Mapa = () => (
  <svg viewBox={`-10 -10 1060 ${MAPA_BR_ALTURA + 20}`} className="h-full w-full" role="img" aria-label="Mapa do Brasil: estados com e sem Pure Pilates">
    {Object.entries(ESTADOS_BR).map(([uf, e]) => (
      <path key={uf} d={e.d} fill={COM_PURE.has(uf) ? VERMELHO : CINZA} stroke="#f6f1ea" strokeWidth={2.5} strokeLinejoin="round" />
    ))}
    {/* o estado "acende" em vermelho quando o avião dele pousa */}
    {ROTAS.map((r) => (
      <path key={r.uf} d={ESTADOS_BR[r.uf].d} fill={VERMELHO} stroke="#f6f1ea" strokeWidth={2.5} strokeLinejoin="round" opacity={0}>
        <animate attributeName="opacity" values="0;0;1;1;0" keyTimes={`0;${f(r.pousa)};${f(r.pousa + 0.03)};${FIM};1`} {...LACO} />
      </path>
    ))}
    {Object.entries(ESTADOS_BR).map(([uf, e]) => {
      if (SEM_ROTULO.has(uf)) return null;
      const rota = ROTA_DE.get(uf);
      const fora = FORA[uf];
      const [x, y] = fora ?? e.c;
      return (
        <g key={uf}>
          {fora && <line x1={e.c[0]} y1={e.c[1]} x2={x - 14} y2={y - 6} stroke="#231f20" strokeWidth={1.2} opacity={0.45} />}
          <text
            x={x}
            y={y}
            textAnchor={fora ? 'start' : 'middle'}
            fontFamily="Montserrat, sans-serif"
            fontWeight={700}
            fontSize={25}
            fill={fora ? '#231f20' : COM_PURE.has(uf) ? '#ffffff' : '#5a544e'}
          >
            {uf}
            {rota && (
              <animate attributeName="fill" values="#5a544e;#5a544e;#ffffff;#ffffff;#5a544e" keyTimes={`0;${f(rota.pousa)};${f(rota.pousa + 0.03)};${FIM};1`} {...LACO} />
            )}
          </text>
        </g>
      );
    })}
    {/* os aviões de papel: de São Paulo rumo a cada estado sem Pure, um depois do outro, em laço */}
    {ROTAS.map((r) => (
      <g key={r.uf}>
        <path id={`em-rota-${r.uf}`} d={r.d} stroke="#231f20" strokeWidth={2.5} strokeDasharray="1 11" strokeLinecap="round" fill="none" opacity={0.28} />
        {/* o pouso: um pulso no destino quando o avião chega */}
        <circle cx={r.x} cy={r.y} r={0} fill="none" stroke="#ffffff" strokeWidth={4} opacity={0}>
          <animate attributeName="r" values="0;0;40;40" keyTimes={`0;${f(r.pousa)};${f(r.pousa + 0.08)};1`} {...LACO} />
          <animate attributeName="opacity" values="0;0;0.9;0;0" keyTimes={`0;${f(r.pousa)};${f(r.pousa + 0.01)};${f(r.pousa + 0.08)};1`} {...LACO} />
        </circle>
        <g opacity={0}>
          <path d="M-27 -18 L32 0 L-27 18 L-14 0 Z" fill="#ffffff" stroke="#231f20" strokeWidth={2.5} strokeLinejoin="round" />
          <path d="M-14 0 L32 0" stroke="#231f20" strokeWidth={2.5} />
          <animateMotion rotate="auto" calcMode="linear" keyPoints="0;0;1;1" keyTimes={`0;${f(r.decola)};${f(r.pousa)};1`} {...LACO}>
            <mpath href={`#em-rota-${r.uf}`} />
          </animateMotion>
          <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes={`0;${f(r.decola)};${f(r.decola + 0.015)};${f(r.pousa)};${f(r.pousa + 0.04)};1`} {...LACO} />
        </g>
      </g>
    ))}
  </svg>
);

const CARTOES = (
  <div className="em-sans grid grid-cols-3 gap-[12px]">
    <div className="rounded-[8px] border border-[#e2dbd1] bg-white px-[18px] py-[16px]">
      <div className="text-[48px] font-bold leading-none text-[#c12030]">16</div>
      <div className="mt-[6px] text-[17px] font-bold text-[#231f20]">UFs com Pure</div>
      <div className="text-[14px] text-[#6b6566]">15 estados + DF</div>
    </div>
    <div className="rounded-[8px] border border-[#e2dbd1] bg-white px-[18px] py-[16px]">
      <div className="text-[48px] font-bold leading-none text-[#231f20]">11</div>
      <div className="mt-[6px] text-[17px] font-bold text-[#231f20]">UFs sem Pure</div>
      <div className="text-[14px] text-[#6b6566]">o próximo território</div>
    </div>
    <div className="rounded-[8px] bg-[#c12030] px-[18px] py-[16px] text-white">
      <div className="text-[48px] font-bold leading-none">0 de 7</div>
      <div className="mt-[6px] text-[17px] font-bold">no Norte</div>
      <div className="text-[14px] text-white/85">região em aberto</div>
    </div>
  </div>
);

// A pergunta vem primeiro; o mapa responde.
export const TerritorioMapa = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={MATERIAS.segundaMaior.pagina + 3} className="!bg-[#f6f1ea]">
    <Miolo className="!inset-x-[56px] !top-[70px]">
      <div className="bg-[#a9293b] px-[32px] py-[26px] text-[#f7ecdc]">
        <p className="em-display text-[44px] font-extrabold uppercase leading-[0.94]">
          Com oportunidades para crescimento fora das atuais praças.{' '}
          <span className="text-[#ffd9a8]">Quer saber mais?</span>
        </p>
      </div>
      <div className="relative mt-[26px] min-h-0 flex-1">
        <div className="absolute inset-0"><Mapa /></div>
        <div className="em-sans absolute bottom-0 left-0 space-y-[7px] text-[14px] text-[#231f20]">
          <div className="flex items-center gap-[10px]"><span className="h-[16px] w-[16px] rounded-[3px] bg-[#c12030]" />Com Pure Pilates</div>
          <div className="flex items-center gap-[10px]"><span className="h-[16px] w-[16px] rounded-[3px] bg-[#d3cdc4]" />Sem Pure Pilates</div>
        </div>
      </div>
    </Miolo>
  </Pagina>
);

// Página seguinte: os números e a presença por região.
export const TerritorioRegioes = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={MATERIAS.segundaMaior.pagina + 4} className="!bg-[#f6f1ea]">
    <Miolo className="!inset-x-[56px] !top-[80px] justify-center">
      {CARTOES}
      <div className="em-sans mt-[56px] text-[16px] font-bold uppercase tracking-[0.04em] text-[#c12030]">Presença por região (UFs)</div>
      <div className="em-sans mt-[20px] space-y-[18px]">
        {REGIOES.map((r) => (
          <div key={r.nome} className="flex items-center gap-[18px]">
            <span className="w-[170px] text-[22px] font-bold text-[#231f20]">{r.nome}</span>
            <span className="flex flex-1 gap-[6px]">
              {Array.from({ length: r.total }, (_, i) => (
                <span key={i} className="h-[34px] w-[42px]" style={{ background: i < r.com ? VERMELHO : CINZA }} />
              ))}
            </span>
            <span className="whitespace-nowrap text-[19px] text-[#6b6566]">{r.com} de {r.total}</span>
          </div>
        ))}
      </div>
      <div className="em-sans mt-[40px] border-t border-[#231f20] pt-[16px] text-[17px] leading-[1.6] text-[#231f20]">
        <p><b>Sem presença hoje:</b> AC, AP, AM, PA, RO, RR, TO · MA, PI · MT, MS</p>
        <p><b>Centro-Oeste:</b> GO e DF com estúdios; MT e MS em aberto.</p>
      </div>
    </Miolo>
  </Pagina>
);
