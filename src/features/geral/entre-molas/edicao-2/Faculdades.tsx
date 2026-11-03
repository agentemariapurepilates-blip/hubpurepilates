import { Corpo, Foto, Miolo, Pagina, type Lado } from '../diagramacao';
import { MATERIAS } from './materias';
import { Chave } from './pecas';
import logoFmu from './fotos/logo-fmu.png';
import logoSantaCasa from './fotos/logo-santa-casa.png';
import logoUnicid from './fotos/logo-unicid.png';
import fmuEquipe from './fotos/fmu-equipe.jpg';
import santaApresentacao from './fotos/santa-casa-apresentacao.jpg';
import santaEquipe from './fotos/santa-casa-equipe.jpg';
import unicidApresentacao from './fotos/unicid-apresentacao.jpg';

// Pure Academy nas faculdades (páginas 36 e 37): uma capa antes do conteúdo e, depois,
// um mosaico único com as fotos dos três eventos (as fotos são de baixa resolução, por
// isso pequenas e juntas) e o texto de cada evento. Fotos e legendas como no Canva.

const P = MATERIAS.faculdades.pagina;

const EVENTOS = [
  { logo: logoSantaCasa, nome: 'Faculdade Santa Casa', data: '10/10/2026', local: 'Núcleo Fisioterapia' },
  { logo: logoFmu, nome: 'FMU', data: '22/10/2026', local: 'Campus Liberdade' },
  { logo: logoUnicid, nome: 'Faculdade UNICID', data: '27/10/2026', local: 'III Semana da Fisio' },
];

export const FaculdadesCapa = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P} tom="vinho" semFolio>
    <div className="absolute inset-x-[64px] top-[84px]">
      <div className="h-[4px] w-[64px] bg-[#f7ecdc]" />
      <div className="em-sans mt-[22px] text-[18px] font-semibold">Pure Academy</div>
      <h2 className="em-display mt-[40px] text-[132px] font-extrabold uppercase leading-[0.84] tracking-[-0.01em]">
        Pure Pilates nas <span className="text-[#ffd9a8]">faculdades</span>
      </h2>
      <p className="em-serif mt-[34px] text-[26px] italic leading-[1.35]">
        Marcamos presenças em importantes eventos acadêmicos, compartilhando conhecimento e fortalecendo a presença da Pure
        Pilates no meio universitário.
      </p>
    </div>
    <div className="absolute inset-x-[64px] top-[700px] grid grid-cols-3 gap-[14px]">
      {EVENTOS.map((e) => (
        <div key={e.nome}>
          <div className="flex h-[96px] items-center justify-center bg-[#f7ecdc] px-[18px]">
            <img src={e.logo} alt={e.nome} draggable={false} className="max-h-[56px] w-auto select-none" />
          </div>
          <div className="em-sans mt-[10px] text-[16px] font-semibold">{e.data}</div>
          <div className="em-sans text-[14px] opacity-80">{e.local}</div>
        </div>
      ))}
    </div>
  </Pagina>
);

// legenda pequena sobre a foto, em caixa normal
const Mosaico = ({ src, legenda, posicao, className }: { src: string; legenda: string; posicao?: string; className?: string }) => (
  <div className={`relative overflow-hidden ${className ?? ''}`}>
    <Foto src={src} alt={legenda} posicao={posicao} className="absolute inset-0 h-full w-full" />
    <div className="em-sans absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-[14px] pb-[10px] pt-[30px] text-[13px] font-semibold text-white">
      {legenda}
    </div>
  </div>
);

export const Faculdades = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P + 1}>
    <Miolo className="!top-[84px]">
      <div className="grid h-[470px] grid-cols-[1.3fr_1fr_1fr] grid-rows-2 gap-[6px]">
        <Mosaico src={santaApresentacao} legenda="Santa Casa · Apresentação" posicao="50% 50%" className="row-span-2" />
        <Mosaico src={santaEquipe} legenda="Santa Casa · Registro da equipe" posicao="50% 30%" className="row-span-2" />
        <Mosaico src={fmuEquipe} legenda="FMU · Registro da equipe" posicao="50% 30%" />
        <Mosaico src={unicidApresentacao} legenda="UNICID · Apresentação" posicao="50% 45%" />
      </div>
      <Corpo capitular className="mt-[30px] !text-[17px]">
        <p className="em-sem-recuo">
          O primeiro encontro foi na Faculdade Santa Casa, em 10/10, com o Núcleo de Fisioterapia. Em 22/10, na FMU, a Pure Academy
          fez parte da programação ENFITO, do Núcleo de Fisioterapia, no Campus Liberdade. E em 27/10, na Faculdade UNICID, a
          apresentação foi na III Semana da Fisio.
        </p>
      </Corpo>
      <Chave className="mt-[30px]">Mais conhecimento, mais conexões, mais Pilates.</Chave>
      <p className="em-sans mt-[10px] text-[16px] opacity-80">A Pure Pilates levando sua experiência e expertise para o ambiente acadêmico.</p>
    </Miolo>
  </Pagina>
);
