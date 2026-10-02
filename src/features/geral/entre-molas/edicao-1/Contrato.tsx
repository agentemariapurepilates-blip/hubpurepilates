import { Miolo, Pagina, Rotulo, VideoAuto, type Lado } from '../diagramacao';
import { MATERIAS } from './materias';
import capaVideo from './fotos/contrato/video-capa.jpg';

// Editoria RH — "Contrato novo, relação mais clara" (2 páginas): o vídeo em página inteira, com a seta
// chamando para a próxima página, e o texto. Texto como enviado pela equipe (02/10/2026); a frase "De quem ensina,
// de quem aprende e de quem faz o negócio crescer." saiu a pedido.

const P = MATERIAS.contrato.pagina;
const VIDEO = '/videos/entre-molas/contrato-instrutores.mp4';

// O vídeo (vertical, 10 s) toca sozinho e em laço; por cima, na base, a seta em movimento pede a próxima página.
export const Contrato1 = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P} tom="escuro">
    <VideoAuto src={VIDEO} poster={capaVideo} somAoAbrir somNoCentro posicao="50% 12%" className="absolute inset-0" />
    {/* a seta atravessa o vídeo inteiro, da esquerda para a direita, sem parar */}
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg viewBox="0 0 400 200" className="em-seta-cruza absolute left-0 top-[52%] h-[230px] w-[460px]" aria-hidden="true">
        <path d="M10 100 H376 M290 14 L376 100 L290 186" fill="none" stroke="#f7ecdc" strokeWidth={15} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-[64px] pb-[92px] pt-[130px] text-[#f7ecdc]">
      <div className="em-display text-[52px] font-extrabold uppercase leading-[0.9]">Leia na próxima página</div>
    </div>
  </Pagina>
);

export const Contrato2 = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P + 1}>
    <Miolo className="!top-[84px]">
      <h2 className="em-display text-[74px] font-extrabold uppercase leading-[0.86] tracking-[-0.01em]">
        Contrato novo, <span className="text-[var(--em-vinho)]">relação mais clara</span>
      </h2>
      <p className="em-serif mt-[22px] border-t-2 border-[var(--em-tinta)] pt-[20px] text-[21px] leading-[1.42]">
        Uma rede que cresce precisa de bases sólidas. E isso vale tanto para a experiência do aluno quanto para a
        forma como cuidamos das pessoas que fazem cada aula acontecer: os nossos instrutores.
      </p>
      <p className="em-sans mt-[16px] text-[18px] leading-[1.52]">
        Pensando nisso, a Pure Pilates lançou o novo{' '}
        <b className="font-bold">Contrato de Prestação de Serviços para Instrutores/Professores de Pilates</b>, um
        modelo padronizado para toda a rede, que traz mais clareza para a relação entre a unidade e o profissional.
      </p>

      {/* as três perguntas: duas curtas à esquerda, o "por quê" à direita */}
      <div className="em-sans mt-[30px] grid grid-cols-2 gap-x-[32px] text-[17px] leading-[1.5]">
        <div className="space-y-[18px]">
          <div className="border-l-[5px] border-[var(--em-vinho)] pl-[16px]">
            <Rotulo>Onde encontrar?</Rotulo>
            <p className="mt-[6px]">
              O contrato já está disponível para download no Pure System e pode ser utilizado imediatamente nas
              contratações da sua unidade.
            </p>
          </div>
          <div className="border-l-[5px] border-[var(--em-vinho)] pl-[16px]">
            <Rotulo>Quem pode ajudar?</Rotulo>
            <p className="mt-[6px]">Equipe de suporte ao franqueado.</p>
          </div>
        </div>
        <div className="border-l-[5px] border-[var(--em-vinho)] pl-[16px]">
          <Rotulo>Por que isso importa?</Rotulo>
          <p className="mt-[6px]">
            Ter um modelo único de contrato é mais um passo na nossa jornada de padronização. Ele facilita a rotina
            do franqueado, dá mais segurança na hora de contratar e garante que todas as unidades conduzam essa
            etapa do mesmo jeito: o jeito Pure.
          </p>
        </div>
      </div>

      <p className="em-display mt-auto text-[46px] font-extrabold uppercase leading-[0.94] text-[var(--em-vinho)]">
        Porque padronizar também é cuidar.
      </p>
      <p className="em-sans -mx-[64px] mt-[20px] w-[820px] max-w-none bg-[#a9293b] px-[64px] py-[18px] text-[19px] font-bold text-[#f7ecdc]">
        📥 Acesse o Pure System e faça o download do novo contrato.
      </p>
    </Miolo>
  </Pagina>
);
