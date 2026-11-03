import type { ReactNode } from 'react';
import { Corpo, Foto, Miolo, Pagina, type Lado } from '../diagramacao';
import { MATERIAS } from './materias';
import { Chave, TituloComFio } from './pecas';
import logoFmu from './fotos/logo-fmu.png';
import logoSantaCasa from './fotos/logo-santa-casa.png';
import logoUnicid from './fotos/logo-unicid.png';
import fmuEquipe from './fotos/fmu-equipe.jpg';
import santaApresentacao from './fotos/santa-casa-apresentacao.jpg';
import santaEquipe from './fotos/santa-casa-equipe.jpg';
import unicidApresentacao from './fotos/unicid-apresentacao.jpg';

// Pure Academy nas faculdades (páginas 35 e 36). Cada evento vem seguido das fotos
// dele, na ordem e com as legendas do Canva (pág. 22 das pautas): Santa Casa
// (apresentação e equipe), FMU (equipe) e UNICID (apresentação).

const P = MATERIAS.faculdades.pagina;

/** O evento dentro do texto: logo e, abaixo, data e local, como abertura do trecho. */
const Evento = ({ logo, nome, data, local }: { logo: string; nome: string; data: string; local: string }) => (
  <div>
    <img src={logo} alt={nome} draggable={false} className="h-[46px] w-auto select-none" />
    <div className="em-sans mt-[12px] text-[15px]">
      <span className="font-semibold text-[var(--em-vinho)]">{data}</span>
      <span className="opacity-75"> · {local}</span>
    </div>
  </div>
);

const ComLegenda = ({ children, legenda, className, recuo }: { children: ReactNode; legenda: string; className?: string; recuo?: boolean }) => (
  <figure className={`flex min-w-0 flex-col ${className ?? ''}`}>
    {children}
    <figcaption className={`em-sans mt-[8px] text-[14px] italic opacity-70 ${recuo ? 'px-[64px]' : ''}`}>{legenda}</figcaption>
  </figure>
);

// Abertura e Santa Casa: a apresentação sangrada; embaixo, o logo e o texto ao lado da foto da equipe.
export const Faculdades1 = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P}>
    <Miolo>
      <div className="em-sans mb-[10px] text-[15px] font-semibold text-[var(--em-vinho)]">Pure Academy</div>
      <TituloComFio tamanho={76}>
        Pure Pilates nas <span className="text-[var(--em-vinho)]">faculdades</span>
      </TituloComFio>
      <ComLegenda legenda="Apresentação na Faculdade Santa Casa" className="-mx-[64px] mt-[26px]" recuo>
        <Foto src={santaApresentacao} alt="Apresentação na Faculdade Santa Casa" className="relative h-[268px] w-[820px] max-w-none" posicao="50% 55%" />
      </ComLegenda>
      <div className="mt-[22px] grid grid-cols-[1.25fr_1fr] gap-[30px]">
        <div>
          <Evento logo={logoSantaCasa} nome="Faculdade Santa Casa" data="10/10/2026" local="Núcleo Fisioterapia" />
          <Corpo colunas={1} capitular className="mt-[16px] !text-[17px]">
            <p className="em-sem-recuo">
              Marcamos presenças em importantes eventos acadêmicos, compartilhando conhecimento e fortalecendo a presença da Pure
              Pilates no meio universitário. O primeiro foi na Faculdade Santa Casa, com o Núcleo de Fisioterapia.
            </p>
          </Corpo>
        </div>
        <ComLegenda legenda="Registro da equipe">
          <Foto src={santaEquipe} alt="Equipe na Faculdade Santa Casa" className="relative h-[244px] w-full" posicao="50% 30%" />
        </ComLegenda>
      </div>
    </Miolo>
  </Pagina>
);

// FMU (foto à esquerda, texto à direita) e UNICID (invertido), com a frase-chave entre eles.
export const Faculdades2 = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P + 1}>
    <Miolo className="!top-[110px]">
      <div className="grid grid-cols-2 gap-[34px]">
        <ComLegenda legenda="Registro da equipe na FMU">
          <Foto src={fmuEquipe} alt="Equipe na FMU" className="relative h-[390px] w-full" posicao="50% 35%" />
        </ComLegenda>
        <div className="flex flex-col">
          <Evento logo={logoFmu} nome="FMU" data="22/10/2026" local="Campus Liberdade" />
          <Corpo colunas={1} className="mt-[16px] !text-[17px]">
            <p className="em-sem-recuo">
              Na FMU, a Pure Academy fez parte da programação ENFITO, do Núcleo de Fisioterapia, no Campus Liberdade.
            </p>
          </Corpo>
          <Chave className="mt-auto">Mais conhecimento, mais conexões, mais Pilates.</Chave>
        </div>
      </div>
      <div className="mt-[30px] grid grid-cols-2 gap-[34px]">
        <div>
          <Evento logo={logoUnicid} nome="Faculdade UNICID" data="27/10/2026" local="III Semana da Fisio" />
          <Corpo colunas={1} className="mt-[16px] !text-[17px]">
            <p className="em-sem-recuo">
              Na Faculdade UNICID, a apresentação foi na III Semana da Fisio. A Pure Pilates levando sua experiência e expertise
              para o ambiente acadêmico.
            </p>
          </Corpo>
        </div>
        <ComLegenda legenda="Apresentação na UNICID">
          <Foto src={unicidApresentacao} alt="Apresentação na Faculdade UNICID" className="relative h-[270px] w-full" posicao="50% 45%" />
        </ComLegenda>
      </div>
    </Miolo>
  </Pagina>
);
