import type { ReactNode } from 'react';
import { Corpo, Foto, Miolo, Pagina, type Lado } from '../diagramacao';
import { MATERIAS } from './materias';
import { Chave, TituloComFio } from './pecas';
import reclameAqui from './fotos/reclame-aqui.png';
import logoBranco from './fotos/logo-pure-branco.png';
import unidade1 from './fotos/unidade-1.jpg';
import unidade2 from './fotos/unidade-2.jpg';
import unidade3 from './fotos/unidade-3.jpg';

// + 500 unidades (fotos das unidades com o layout novo) e
// Reputação (vídeo, os números e o texto). Texto exatamente como no Canva.

const P = MATERIAS.reputacao.pagina;

// Página-anúncio, em vinho: a marca das 500 unidades em destaque e as fotos das
// unidades com o layout novo em faixa, como um anúncio de revista.
export const Unidades = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={MATERIAS.unidades.pagina} tom="vinho">
    <div className="absolute inset-x-[64px] top-[70px]">
      <h2 className="em-display font-extrabold uppercase leading-[0.86] tracking-[-0.01em]">
        <span className="block text-[60px]">Atingimos a marca de</span>
        <span className="flex items-end gap-[22px]">
          <span className="text-[210px] leading-[0.8] text-[#ffd9a8]">+500</span>
          <span className="pb-[8px] text-[76px]">unidades.</span>
        </span>
      </h2>
    </div>
    {/* as fotos ocupam o resto da página: uma grande sangrada à esquerda, duas empilhadas */}
    <div className="absolute left-0 right-[64px] top-[330px] grid h-[490px] grid-cols-[1.45fr_1fr] gap-[10px]">
      <Foto src={unidade1} alt="Unidade com o layout novo" className="relative h-full w-full" posicao="40% 55%" />
      <div className="grid grid-rows-2 gap-[10px]">
        <Foto src={unidade2} alt="Unidade com o layout novo" className="relative h-full w-full" posicao="45% 50%" />
        <Foto src={unidade3} alt="Unidade com o layout novo" className="relative h-full w-full" posicao="50% 50%" />
      </div>
    </div>
    <p className="em-sans absolute left-[64px] top-[846px] text-[15px] italic opacity-85">Imagens de unidades com layout novo.</p>
    <img src={logoBranco} alt="Pure Pilates" draggable={false} className="absolute right-[64px] top-[838px] w-[130px] select-none" />
  </Pagina>
);

// Quadro do vídeo de reputação, que ainda não chegou.
export const ReputacaoVideo = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P} tom="escuro">
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="em-display text-[64px] font-extrabold uppercase leading-none opacity-40">Vídeo Reputação</div>
    </div>
  </Pagina>
);

export const ReputacaoNumeros = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P + 1} tom="vinho">
    <div className="absolute bottom-[110px] left-[64px] right-[64px]">
      <div className="mb-[28px] h-[4px] w-[64px] bg-[#f7ecdc]" />
      <div className="em-sans mb-[20px] text-[18px] font-bold uppercase tracking-[0.22em]">O que é, O que é?</div>
      <p className="em-display text-[86px] font-extrabold uppercase leading-[0.9] tracking-[-0.01em]">
        30 milhões de acessos mensais, sendo dois terços desse tráfego de consumidores pesquisando{' '}
        <span className="text-[#ffd9a8]">marcas para decidir compras.</span>
      </p>
    </div>
  </Pagina>
);

// Número em destaque: o número grande em vinho, a explicação no tamanho do texto.
const Numero = ({ valor, children }: { valor: string; children: ReactNode }) => (
  <div>
    <div className="em-display text-[64px] font-extrabold leading-[0.95] text-[var(--em-vinho)]">{valor}</div>
    <p className="em-sans mt-[6px] text-[16px] leading-[1.4]">{children}</p>
  </div>
);

export const ReputacaoTexto = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P + 2}>
    <Miolo>
      <TituloComFio tamanho={80}>
        Reclame <span className="text-[var(--em-vinho)]">Aqui</span>
      </TituloComFio>
      <p className="em-serif mt-[18px] text-[24px] italic leading-[1.38]">
        Antes de entrar em um estúdio, muita gente faz a mesma coisa: pesquisa.
      </p>
      <Corpo capitular className="mt-[22px]">
        <p className="em-sem-recuo">
          E o Reclame Aqui é um dos primeiros lugares onde essa pesquisa acontece. Os números mostram o tamanho disso. A
          plataforma soma mais de 28 milhões de consumidores cadastrados e recebe, em média, 46 mil reclamações por dia. São
          cerca de 30 milhões de acessos por mês, e dois em cada três vêm de pessoas pesquisando marcas antes de decidir uma
          compra.
        </p>
      </Corpo>
      <img
        src={reclameAqui}
        alt="Página da Pure Pilates no Reclame Aqui"
        draggable={false}
        className="mt-[34px] w-full select-none bg-white p-[12px] shadow-[0_18px_40px_-18px_rgba(0,0,0,0.45)]"
      />
      <div className="mt-[40px] grid grid-cols-3 gap-[28px]">
        <Numero valor="28 mi">consumidores cadastrados na plataforma</Numero>
        <Numero valor="46 mil">reclamações por dia, em média</Numero>
        <Numero valor="30 mi">acessos por mês, dois terços pesquisando marcas</Numero>
      </div>
    </Miolo>
  </Pagina>
);

export const ReputacaoTexto2 = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P + 3}>
    <Miolo>
      <div className="grid grid-cols-2 gap-[36px] border-b border-[var(--em-tinta)]/20 pb-[22px]">
        <div>
          <div className="em-display text-[96px] font-extrabold leading-[0.9] text-[var(--em-vinho)]">8 em 10</div>
          <p className="em-serif mt-[12px] text-[22px] italic leading-[1.38]">brasileiros leem avaliações antes de contratar um produto ou serviço.</p>
        </div>
        <div>
          <div className="em-display text-[96px] font-extrabold leading-[0.9] text-[var(--em-vinho)]">72%</div>
          <p className="em-serif mt-[12px] text-[22px] italic leading-[1.38]">deixariam de comprar de uma empresa que não se importa com a opinião dos clientes.</p>
        </div>
      </div>
      <Corpo className="mt-[22px]">
        <p className="em-sem-recuo">
          E essa consulta pesa na escolha: 8 em cada 10 brasileiros leem avaliações antes de contratar um produto ou serviço,
          e 72% deixariam de comprar de uma empresa que não se importa com a opinião dos clientes.
        </p>
        <p>
          Ou seja: quem pesquisa a Pure no Reclame Aqui não quer saber só se existem reclamações. Quer saber, principalmente,
          como a marca reage quando algo dá errado.
        </p>
        <p>
          Agora com o Pure Monitor temos uma visão completa de diversos canais e redes sociais. Com a Brand Page da Pure Pilates
          no Reclame Aqui conseguimos melhorar a nossa visibilidade e agora unimos mais esforços para esta forma que somos vistos
          e reconhecidos.
        </p>
        <p>
          A atenção tem que ser coletiva nos chamados internos. A busca de soluções conjunta entre franqueados e equipe de
          suporte deve ser tratada para melhorarmos a reputação da nossa marca neste canal.
        </p>
      </Corpo>
      <Chave className="mt-[22px]">Quem pesquisa quer saber, principalmente, como a marca reage quando algo dá errado.</Chave>
      <div className="em-tom--vinho mt-[24px] px-[28px] py-[18px]">
        <p className="em-serif text-[24px] italic">Contamos com todos!</p>
      </div>
    </Miolo>
  </Pagina>
);
