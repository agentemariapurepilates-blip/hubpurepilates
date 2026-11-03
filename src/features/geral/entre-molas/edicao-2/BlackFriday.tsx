import type { ReactNode } from 'react';
import { Corpo, Foto, Miolo, Pagina, VideoAuto, type Lado } from '../diagramacao';
import { MATERIAS } from './materias';
import { TituloComFio } from './pecas';
import kvFundo from './fotos/bf-kv-fundo.jpg';
import logoBranco from './fotos/logo-pure-branco.png';
import gravacao from './fotos/gravacao-campanha.jpg';

// A nova porta de entrada, Black Friday 2026 (páginas 17 a 23). Só o texto vem dos
// slides do Canva; a diagramação é a da revista.

const P = MATERIAS.blackFriday.pagina;
const VIDEO_JULIA = '/videos/entre-molas/edicao-2/reels-julia-rabello.mp4';
const VIDEO_FILME = '/videos/entre-molas/edicao-2/filme-amigas.mp4';
const VIDEO_JORNADA = '/videos/entre-molas/edicao-2/jornada-comece.mp4';

// Duas barrinhas vermelhas, a marca do KV "Black sem dor".
const Barras = ({ largura = 60 }: { largura?: number }) => (
  <span className="inline-flex flex-col gap-[5px] align-middle" style={{ width: largura }}>
    <span className="h-[6px] w-[78%] rounded-full bg-[#e01e2e]" />
    <span className="ml-[22%] h-[6px] w-[78%] rounded-full bg-[#e01e2e]" />
  </span>
);

// Abre a matéria: a chamada da campanha, o KV "Black sem dor" recriado na vertical
// (o fundo é um recorte do KV sem os textos; os textos são os dele).
export const Bf1 = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P} tom="escuro" folioCurto>
    <div className="absolute inset-0 bg-[#140c0b]" />
    <img src={kvFundo} alt="" draggable={false} className="absolute left-0 top-[-90px] w-[820px] max-w-none select-none" />
    <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/10 via-40% to-[#140c0b] to-[88%]" />
    <div className="em-sans absolute inset-x-0 top-[62px] text-center text-white">
      <div className="text-[150px] font-black leading-[0.95] tracking-[-0.02em]">BLACK</div>
      <div className="mt-[6px] flex items-center justify-center gap-[14px] text-[66px] font-black leading-none">
        <Barras /> SEM DOR <Barras />
      </div>
      <div className="mt-[16px] text-[21px] font-normal tracking-[0.62em]">PURE PILATES</div>
    </div>
    <div className="em-sans absolute left-[50px] right-[50px] top-[626px] rounded-[110px] bg-[#151515] py-[24px] text-center text-white">
      <div className="text-[124px] font-black leading-[1] tracking-[-0.01em] text-[#d3102d]">50% OFF</div>
      <div className="mt-[4px] text-[25px] leading-none">NO <b>PRIMEIRO MÊS</b> COM PURE PASS</div>
    </div>
    <img src={logoBranco} alt="Pure Pilates" draggable={false} className="absolute bottom-[38px] left-[64px] w-[150px] select-none" />
    <div className="em-sans absolute bottom-[34px] right-[120px] text-right text-[32px] font-extrabold leading-[1.12] text-white">
      <div>SEM DOR NO CORPO <Barras largura={44} /></div>
      <div><Barras largura={44} /> SEM DOR NO BOLSO</div>
    </div>
  </Pagina>
);

// A nova porta de entrada: a foto da equipe na gravação, sangrada no topo, e o texto.
export const Bf2 = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P + 2}>
    <Foto src={gravacao} alt="Equipe na gravação da campanha" className="absolute inset-x-0 top-0 h-[470px] w-full" posicao="50% 32%" />
    <div className="absolute inset-x-[64px] top-[500px]">
      <div className="em-sans text-[13px] font-bold uppercase tracking-[0.22em] text-[var(--em-vinho)]">Black Friday 2026</div>
      <div className="mt-[8px]">
        <TituloComFio tamanho={72}>
          A nova porta de <span className="text-[var(--em-vinho)]">entrada</span>
        </TituloComFio>
      </div>
      <p className="em-serif mt-[18px] text-[20.5px] leading-[1.45]">
        Agora as campanhas passam otimizar oferecer a aula experimental e a venda de planos Pure Pass. Durante o mês de
        novembro teremos a oferta de 50% desconto no primeiro mês e também algumas unidades com cobrança na aula. Com isso,
        nossos resultados serão otimizados pela conversão de vendas. O fluxo do visitante é totalmente novo e, a mensuração
        dos dois modelos também será uma nova conquista para a rede.
      </p>
    </div>
  </Pagina>
);

// A jornada em seis passos: vídeo de página inteira, feito no Remotion com os prints
// da /comece (repo videos-tutoriais-pure, pasta jornada-comece). Formato 820×1000,
// o mesmo da página, para não cortar nada.
export const BfJornada = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P + 3} tom="escuro" semFolio>
    <VideoAuto src={VIDEO_JORNADA} somAoAbrir somNoCentro className="absolute inset-0" />
  </Pagina>
);

// Os dois fluxos de mídia, contados como matéria. Hierarquia (a mesma da revista):
// caixa-alta só no título; linha fina e destaque em serifa itálica, um degrau acima
// do texto; o caminho do lead em motion, a seta percorrendo as etapas.
const Fluxo = ({
  lado,
  numero,
  kicker,
  titulo,
  linhaFina,
  children,
  destaque,
  nota,
  caminho,
}: {
  lado: Lado;
  numero: number;
  kicker: string;
  titulo: ReactNode;
  linhaFina: ReactNode;
  children: ReactNode;
  destaque: ReactNode;
  nota?: ReactNode;
  caminho: [string, string][];
}) => (
  <Pagina lado={lado} numero={numero}>
    <Miolo>
      <div className="em-sans mb-[10px] text-[15px] font-semibold text-[var(--em-vinho)]">{kicker}</div>
      <TituloComFio tamanho={76}>{titulo}</TituloComFio>
      <p className="em-serif mt-[18px] text-[22px] italic leading-[1.4]">{linhaFina}</p>
      <Corpo capitular className="mt-[22px] !text-[17px]">
        {children}
      </Corpo>
      <figure className="mt-[30px] border-l-[3px] border-[var(--em-vinho)] pl-[22px]">
        <blockquote className="em-serif text-[22px] leading-[1.4]">{destaque}</blockquote>
        {nota && <figcaption className="em-sans mt-[8px] text-[14px] opacity-65">{nota}</figcaption>}
      </figure>

      {/* o caminho do lead: a seta anda e cada etapa acende quando ela passa */}
      <div className="mt-[52px]">
        <div className="em-sans text-[15px] font-semibold text-[var(--em-vinho)]">O caminho do lead</div>
        <div className="relative mt-[18px] pb-[4px]">
          <div className="absolute left-[9px] right-[9px] top-[8px] h-[2px] bg-[var(--em-tinta)]/12" />
          <div className="absolute left-[9px] right-[9px] top-[8px] h-[2px]">
            <div className="em-trilha relative h-full bg-[var(--em-vinho)]">
              <svg viewBox="0 0 10 10" className="absolute -right-[7px] -top-[6px] h-[14px] w-[14px] fill-[var(--em-vinho)]">
                <path d="M0 0 L10 5 L0 10 z" />
              </svg>
            </div>
          </div>
          <div className="relative grid grid-cols-4 gap-[16px]">
            {caminho.map(([etapa, detalhe], i) => (
              <div key={etapa} className={i === 3 ? 'text-right' : i > 0 ? 'text-center' : ''}>
                <span
                  className="em-etapa inline-block h-[18px] w-[18px] rounded-full border-[3px] border-[var(--em-vinho)] bg-[var(--em-papel,#f4e8d6)]"
                  style={{ animationName: `em-etapa-${i}` }}
                />
                <div className="em-etapa mt-[10px]" style={{ animationName: `em-etapa-${i}` }}>
                  <div className="em-sans text-[13px] font-semibold text-[var(--em-vinho)]">{String(i + 1).padStart(2, '0')}</div>
                  <div className="em-sans mt-[2px] text-[18px] font-semibold leading-[1.25]">{etapa}</div>
                  <div className="em-sans mt-[4px] text-[15px] leading-[1.4] opacity-75">{detalhe}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Miolo>
  </Pagina>
);

export const BfSemAporte = ({ lado }: { lado: Lado }) => (
  <Fluxo
    lado={lado}
    numero={P + 4}
    kicker="Fluxo de mídia · Unidades abertas sem aporte"
    titulo={<>Unidades sem <span className="text-[var(--em-vinho)]">aporte</span></>}
    linhaFina="A mídia é da rede, o destino é um só e quem escolhe a unidade é o lead."
    destaque={<>Uma única página de destino para toda a mídia da rede: <span className="italic text-[var(--em-vinho)]">purepilates.com.br/comece</span>.</>}
    caminho={[
      ['Mídia da rede', 'Verba de contribuição.'],
      ['Página /comece', 'Busca por CEP ou localização.'],
      ['Escolha da unidade', 'Pure Pass, experimental ou avulsa.'],
      ['Adesão online', '50% off no 1º mês.'],
    ]}
  >
    <p className="em-sem-recuo">
      Nas unidades abertas sem aporte, quem faz a mídia é a rede, com a verba de contribuição. O anúncio leva sempre ao mesmo
      endereço, a página /comece, e ali o lead busca por CEP ou localização e escolhe a unidade mais próxima.
    </p>
    <p>
      A campanha é otimizada para a venda de Pure Pass: 50% off no primeiro mês, com adesão online. Quem preferir pode fazer a
      aula experimental ou a aula avulsa, por R$ 0,00 ou R$ 39,90, conforme a unidade.
    </p>
  </Fluxo>
);

export const BfComAporte = ({ lado }: { lado: Lado }) => (
  <Fluxo
    lado={lado}
    numero={P + 5}
    kicker="Fluxo de mídia · Unidades com aporte"
    titulo={<>Unidades com <span className="text-[var(--em-vinho)]">aporte</span></>}
    linhaFina="A mídia é da unidade e o lead já chega na porta certa, sem passar pela busca."
    destaque={<>Cada unidade com aporte tem <span className="italic text-[var(--em-vinho)]">a sua própria página</span>.</>}
    nota="Exemplo: purepilates.com.br/comece-aqui/sp/sao-paulo/casa-verde"
    caminho={[
      ['Mídia da unidade', 'Verba local, com UTM própria.'],
      ['Página da unidade', 'Sem busca e sem menu.'],
      ['Aula agendada', 'Experimental é o foco.'],
      ['Crédito na unidade', 'O resultado é da unidade.'],
    ]}
  >
    <p className="em-sem-recuo">
      Nas unidades com aporte, a mídia é da própria unidade: verba local, no raio dela, com UTM própria. O anúncio leva direto à
      página da unidade, em /comece-aqui, sem busca, sem menu e sem trocar de unidade.
    </p>
    <p>
      Aqui a campanha é otimizada para o agendamento de aula experimental. O Pure Pass continua disponível, com adesão online e
      50% off no primeiro mês, e o resultado fica creditado na unidade.
    </p>
  </Fluxo>
);

// Os vídeos da campanha, em página inteira: o Reels da Julia logo depois da chamada e o filme fechando a matéria.
export const BfVideoJulia = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P + 1} tom="escuro" semFolio>
    <VideoAuto src={VIDEO_JULIA} somAoAbrir somNoCentro className="absolute inset-0" />
  </Pagina>
);

export const BfVideoFilme = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P + 6} tom="escuro" semFolio>
    <VideoAuto src={VIDEO_FILME} somNoCentro className="absolute inset-0" />
  </Pagina>
);
