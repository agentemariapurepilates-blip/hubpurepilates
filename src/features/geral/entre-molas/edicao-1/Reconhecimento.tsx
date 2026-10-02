import { Miolo, Pagina, type Lado } from '../diagramacao';
import { MATERIAS } from './materias';

// Reconhecimento (1 página): o NEEX 2026, com o texto e a publicação do Instagram embedada. Texto exatamente como
// enviado pela equipe. (Os prêmios Boa Forma e PEGN 2025 saíram: são antigos.)

const P = MATERIAS.reconhecimento.pagina;

// Publicação do NEEX no Instagram (@purepilates.franchising). O embed oficial tem cabeçalho (54) + foto 3:4 +
// rodapé (~155): a altura abaixo é calculada para a largura do quadro.
const POST_INSTAGRAM = 'https://www.instagram.com/p/DdZmvztJubq/embed/';
const LARGURA_POST = 340;
const ALTURA_POST = Math.round(54 + (LARGURA_POST * 4) / 3 + 156);

// Abertura em papel claro: título, o texto e a publicação (dá para passar as fotos e abrir no Instagram sem sair
// da revista). O que a arte da publicação já diz não se repete na página.
export const Reconhecimento1 = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P}>
    <Miolo className="!top-[84px]">
      <h2 className="em-display text-[66px] font-extrabold uppercase leading-[0.88] tracking-[-0.01em]">
        Mais um reconhecimento
        <br />
        <span className="text-[var(--em-vinho)]">para a Pure Pilates.</span>
      </h2>
      <div className="mt-[24px] flex min-h-0 flex-1 gap-[30px] border-t-2 border-[var(--em-tinta)] pt-[24px]">
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="em-serif text-[24px] leading-[1.45]">
            Pelo segundo ano consecutivo, a Pure Franchising está entre as marcas reconhecidas pelo Prêmio Negócios
            em Expansão, da EXAME em parceria com o BTG Pactual Empresas. 🏆
          </p>
          {/* o destaque fica no meio do espaço que sobra ao lado da publicação: nem colado no texto, nem no rodapé */}
          <p className="em-display my-auto border-l-[5px] border-[var(--em-vinho)] pl-[18px] text-[46px] font-extrabold uppercase leading-[0.94]">
            A Pure Franchising integra o ranking do <span className="text-[var(--em-vinho)]">NEEX 2026</span>
          </p>
        </div>
        <iframe
          src={POST_INSTAGRAM}
          title="Publicação da Pure Franchising no Instagram: Prêmio Negócios em Expansão"
          width={LARGURA_POST}
          height={ALTURA_POST}
          scrolling="no"
          allow="encrypted-media; clipboard-write"
          className="shrink-0 self-start rounded-[6px] border-0 bg-white shadow-[0_22px_50px_-20px_rgba(0,0,0,0.45)]"
        />
      </div>
    </Miolo>
  </Pagina>
);
