import type { ReactNode } from 'react';
import { Corpo, Miolo, Pagina, type Lado } from '../diagramacao';
import { MATERIAS } from './materias';
import { Chave, TituloComFio } from './pecas';
import reclameAqui from './fotos/reclame-aqui.png';

// Reputação (páginas 14 a 17): vídeo, os números e o texto. Texto exatamente como no Canva.

const P = MATERIAS.reputacao.pagina;

// Quadro do vídeo de reputação, que ainda não chegou. Fica numa página da direita.
export const ReputacaoVideo = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P} tom="escuro" semFolio>
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
        <Numero valor="28 mm">consumidores cadastrados na plataforma</Numero>
        <Numero valor="46 mil">reclamações por dia, em média</Numero>
        <Numero valor="30 mm">acessos por mês, dois terços pesquisando marcas</Numero>
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
