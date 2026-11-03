import { useQuery } from '@tanstack/react-query';
import { Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { EpisodioDaTela } from '@/features/geral/segredos-pilar/SegredosPilar';
import { Pagina, type Lado } from '../diagramacao';
import { MATERIAS } from './materias';
import { Chave } from './pecas';
import capaCartilha from './fotos/cartilha-capa.jpg';
import logoPilar from './fotos/segredos-de-pilar-logo.png';

// Segredos de Pilar (páginas 38 a 41): capa, o método R.E.F.O.R.M.E.R. letra por letra,
// o último episódio e a chamada para baixar a cartilha. Textos da própria cartilha.

const P = MATERIAS.pilar.pagina;
const CARTILHA = '/arquivos/segredos-de-pilar/cartilha-reformer.pdf';
const ABA = '/segredos-de-pilar';

const LETRAS = [
  { l: 'R', t: 'Recepcionar e conectar', d: 'Criar acolhimento, vínculo e conexão emocional.' },
  { l: 'E', t: 'Entender e avaliar', d: 'Descobrir dores, objetivos, rotina e fator motivacional.' },
  { l: 'F', t: 'Focar nos benefícios', d: 'Ligar os benefícios do Pilates ao que o aluno quer conquistar.' },
  { l: 'O', t: 'Oferecer o plano ideal', d: 'Indicar o plano que mais faz sentido para aquele perfil.' },
  { l: 'R', t: 'Ressaltar o valor', d: 'Fazer o aluno enxergar valor antes de enxergar preço.' },
  { l: 'M', t: 'Manejar objeções', d: 'Acolher inseguranças e conduzir com estratégia.' },
  { l: 'E', t: 'Estimular a decisão', d: 'Usar as cartas na manga no timing emocional certo.' },
  { l: 'R', t: 'Realizar a matrícula', d: 'Finalizar de forma simples, segura e celebrando.' },
];

// os anéis rosados da cartilha, ao fundo
const Aneis = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
    <div className="absolute -right-[180px] -top-[120px] h-[520px] w-[520px] rounded-full border-[90px] border-[#a9293b]/10" />
    <div className="absolute -bottom-[260px] -right-[120px] h-[720px] w-[720px] rounded-full border-[90px] border-[#a9293b]/10" />
  </div>
);

export const PilarCapa = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P} semFolio>
    <Aneis />
    <img src={logoPilar} alt="Segredos de Pilar" draggable={false} className="absolute left-[64px] top-[250px] w-[460px] select-none" />
    <div className="absolute left-[64px] right-[180px] top-[520px]">
      <div className="h-[2px] w-[300px] bg-[var(--em-tinta)]/70" />
      <p className="em-serif mt-[30px] text-[40px] leading-[1.15]">
        Você viu os Segredos de Pilar.
        <br />
        <span className="font-semibold text-[var(--em-vinho)]">Agora, guarde o essencial.</span>
      </p>
      <p className="em-sans mt-[22px] text-[17px] opacity-75">Educação corporativa Pure Pilates</p>
    </div>
  </Pagina>
);

export const PilarReformer = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P + 1}>
    <div className="absolute inset-x-[64px] top-[84px]">
      <div className="em-sans text-[15px] font-semibold text-[var(--em-vinho)]">Segredos de Pilar · o método</div>
      <h2 className="em-display mt-[8px] text-[76px] font-extrabold uppercase leading-[0.9] tracking-[0.02em]">R.E.F.O.R.M.E.R.</h2>
      <p className="em-serif mt-[12px] text-[21px] italic leading-[1.4]">
        Funciona como o próprio aparelho Reformer: não é sobre força, é sobre condução. Cada letra é uma etapa que o aluno
        precisa atravessar.
      </p>
    </div>
    <div className="absolute inset-x-[64px] top-[330px]">
      {LETRAS.map((x, i) => (
        <div
          key={i}
          className="em-sobe flex items-center gap-[22px] border-b border-[var(--em-tinta)]/12 py-[9px]"
          style={{ animationDelay: `${1 + i * 0.18}s` }}
        >
          <span className="em-display w-[46px] text-[48px] font-extrabold leading-none text-[var(--em-vinho)]">{x.l}</span>
          <span className="em-sans w-[230px] text-[17px] font-bold leading-[1.25]">{x.t}</span>
          <span className="em-sans flex-1 text-[15.5px] leading-[1.4] opacity-80">{x.d}</span>
        </div>
      ))}
    </div>
  </Pagina>
);

// O último episódio liberado, lido da mesma fonte da aba Segredos de Pilar (a Edge
// Function respeita o que cada pessoa pode ver). A página inteira é um link: abre a aba
// em outra guia, onde o episódio toca.
const useUltimoEpisodio = () =>
  useQuery({
    queryKey: ['segredos-pilar-episodios'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<{ temporadas: { episodios: EpisodioDaTela[] }[] }>(
        'segredos-pilar-episodios',
      );
      if (error) throw error;
      return data!;
    },
    staleTime: 60 * 1000,
    select: (d) => {
      const liberados = d.temporadas.flatMap((t) => t.episodios).filter((e) => e.liberado && e.numero !== null);
      return liberados.sort((x, y) => (y.numero ?? 0) - (x.numero ?? 0))[0] ?? null;
    },
  });

export const PilarEpisodio = ({ lado }: { lado: Lado }) => {
  const { data: ep } = useUltimoEpisodio();
  return (
    <Pagina lado={lado} numero={P + 2} tom="escuro" semFolio>
      <a
        href={ABA}
        target="_blank"
        rel="noreferrer"
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="group absolute inset-0 block"
        aria-label="Assistir ao último episódio de Segredos de Pilar (abre em outra aba)"
      >
        {/* a capa do episódio desfocada ao fundo e, no meio, a prévia em 16:9 com o play.
            As capas do Drive só aparecem sem referrer, como na aba Segredos de Pilar. */}
        {ep?.capa && (
          <img src={ep.capa} alt="" referrerPolicy="no-referrer" draggable={false} className="absolute inset-0 h-full w-full scale-110 select-none object-cover opacity-45 blur-[22px]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/80" />
        <div className="absolute inset-x-[64px] top-[84px] text-[#f7ecdc]">
          <div className="em-sans text-[16px] font-semibold text-[#ffd9a8]">Segredos de Pilar · último episódio</div>
        </div>
        <div className="absolute inset-x-[40px] top-[150px] aspect-video overflow-hidden bg-neutral-900 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.85)]">
          {ep?.capa && (
            <img src={ep.capa} alt="" referrerPolicy="no-referrer" draggable={false} className="h-full w-full select-none object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/15">
            <span className="flex h-[110px] w-[110px] items-center justify-center rounded-full bg-[#a9293b] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.7)] transition-transform group-hover:scale-110">
              <Play className="ml-[8px] h-[48px] w-[48px] fill-[#f7ecdc] text-[#f7ecdc]" />
            </span>
          </div>
        </div>
        <div className="absolute inset-x-[64px] top-[620px] text-[#f7ecdc]">
          <div className="em-display text-[64px] font-extrabold uppercase leading-[0.92]">
            {ep ? (ep.numero !== null ? `Episódio ${ep.numero}` : 'Especial') : 'Assista agora'}
          </div>
          {ep && <p className="em-serif mt-[10px] text-[26px] italic leading-[1.3]">{ep.titulo}</p>}
          <p className="em-sans mt-[22px] text-[15px] opacity-80">Toque para assistir na aba Segredos de Pilar.</p>
        </div>
      </a>
    </Pagina>
  );
};

export const PilarCartilha = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P + 3}>
    <div className="absolute inset-x-[64px] top-[84px]">
      <div className="em-sans text-[15px] font-semibold text-[var(--em-vinho)]">Segredos de Pilar</div>
      <h2 className="em-display mt-[8px] text-[72px] font-extrabold uppercase leading-[0.9]">
        Baixe a <span className="text-[var(--em-vinho)]">cartilha</span>
      </h2>
      <p className="em-serif mt-[14px] text-[22px] italic leading-[1.4]">
        O guia rápido de condução da venda, para consultar antes de cada apresentação de planos.
      </p>
    </div>
    <div className="absolute left-[64px] top-[330px] w-[300px]">
      <img src={capaCartilha} alt="Capa da Cartilha R.E.F.O.R.M.E.R." draggable={false} className="w-full select-none shadow-[0_24px_50px_-20px_rgba(0,0,0,0.5)]" />
    </div>
    <div className="absolute left-[400px] right-[64px] top-[340px]">
      <Chave>Você não é vendedor. Você é consultor de bem-estar.</Chave>
      <p className="em-sans mt-[22px] text-[17px] leading-[1.5]">
        Sempre que lembrar da palavra REFORMER, lembre da ordem certa da condução. Assim como no Pilates, a venda também precisa
        de sequência, fluidez e condução.
      </p>
      <a
        href={CARTILHA}
        download="Cartilha REFORMER - Segredos de Pilar.pdf"
        target="_blank"
        rel="noreferrer"
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="em-sans mt-[30px] inline-flex items-center gap-[10px] bg-[var(--em-vinho)] px-[26px] py-[16px] text-[17px] font-bold text-[#f7ecdc] hover:brightness-110"
      >
        Baixar a cartilha (PDF) ↓
      </a>
    </div>
  </Pagina>
);
