import type { CSSProperties } from 'react';
import { Citacao, Miolo, Pagina, type Lado } from '../diagramacao';
import { MATERIAS } from './materias';
import roberto from './fotos/expansao/roberto-serroni-entrevista.jpg';

// Abertura da editoria Expansão: a página do Roberto (foto no topo + a fala dele) e, em seguida, o motion
// "Leve a Pure para novos horizontes", refeito a partir da arte de referência da equipe (02/10/2026).

const P = MATERIAS.segundaMaior.pagina;

export const ExpansaoRoberto = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P}>
    <Miolo className="!top-0">
      <figure className="relative -mx-[64px] min-h-0 w-[820px] max-w-none flex-1 overflow-hidden">
        <img
          src={roberto}
          alt="Roberto Perfeito Serroni em entrevista"
          draggable={false}
          className="h-full w-full select-none object-cover"
          style={{ objectPosition: '50% 40%' }}
        />
        <figcaption className="em-sans absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent px-[64px] pb-[18px] pt-[70px] text-right text-[#f7ecdc]">
          {/* legenda à direita: fica embaixo dele, não do entrevistador */}
          <span className="em-display block text-[40px] font-extrabold uppercase leading-[0.95]">Roberto Perfeito Serroni</span>
          <span className="mt-[4px] block text-[16px] font-semibold uppercase tracking-[0.14em]">Sócio e Diretor de Expansão</span>
        </figcaption>
      </figure>
      <Citacao tamanho={38} className="mt-[30px]">
        "Quem já é Pure conhece a força do nosso modelo como ninguém. Por isso, o franqueado é o nosso melhor parceiro
        para levar a Pure para novos horizontes, seja abrindo uma nova unidade ou indicando quem pode fazer parte
        dessa história."
      </Citacao>
    </Miolo>
  </Pagina>
);

const PALAVRAS = ['Movimento', 'Conexão', 'Expansão', 'Crescimento'];
const ordem = (i: number) => ({ '--i': i }) as CSSProperties;

// O motion, em página inteira (a arte de referência tem a mesma proporção da página). Animação só em CSS
// (entre-molas.css): não pesa e recomeça sozinha.
export const ExpansaoHorizonte = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P + 1} tom="vinho">
    <div className="absolute inset-x-[64px] top-[92px]">
      <div className="em-sans text-[16px] font-bold uppercase tracking-[0.2em] text-[#f7ecdc]">
        Leve a Pure para novos horizontes
      </div>
      <div className="em-sans mt-[44px] text-[108px] font-extrabold leading-[1.2] tracking-[-0.02em]">
        {PALAVRAS.map((p, i) => (
          <div key={p} className="em-hz-palavra" style={ordem(i)}>
            {p}
          </div>
        ))}
        <div className="flex items-center gap-[26px]">
          <span className="em-hz-final" style={ordem(PALAVRAS.length)}>Horizonte</span>
          <svg viewBox="0 0 100 80" className="em-hz-seta h-[76px] w-[96px] shrink-0" style={ordem(PALAVRAS.length)} aria-hidden="true">
            <path d="M4 40 H94 M60 6 L94 40 L60 74" fill="none" stroke="#ffffff" strokeWidth={5} strokeLinejoin="miter" />
          </svg>
        </div>
      </div>
    </div>
  </Pagina>
);
