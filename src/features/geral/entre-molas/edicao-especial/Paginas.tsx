import { useState, type ReactNode, type SyntheticEvent } from 'react';
import { Foto, Pagina, Rotulo, Titulo, useNavegacao, type Lado } from '../diagramacao';
import fotoAula from './fotos/foto-aula.jpg';
import fotoAulao1 from './fotos/foto-aulao-1.jpg';
import fotoAulao2 from './fotos/foto-aulao-2.jpg';
import fotoGestao from './fotos/foto-gestao.jpg';
import fotoRecepcao from './fotos/foto-recepcao.jpg';
import fotoStudio from './fotos/foto-studio.jpg';
import { CalendarioNovembro, NotaFiscal, SemanaAlternada } from './Ilustracoes';
import { MATERIAS, ORDEM_DO_SUMARIO } from './materias';

// Páginas da Edição especial · Nota fiscal. Texto exatamente como na edição
// original (ver materias.ts); aqui só muda a diagramação, uma página por vez.

type P = { lado: Lado };

// Clique em controle da página (checklist, sumário) não pode virar a folha.
const segura = (e: SyntheticEvent) => e.stopPropagation();

/** Abertura de seção: número grande, chapéu, título e linha fina. */
const Cabeca = ({ n, chapeu, titulo, fina, tam = 70 }: { n: string; chapeu: string; titulo: ReactNode; fina?: ReactNode; tam?: number }) => (
  <div>
    <div className="flex items-start gap-[24px] border-b-2 border-current pb-[18px]">
      <div className="em-display text-[112px] font-extrabold leading-[0.78] text-[var(--em-vinho)]">{n}</div>
      <div className="min-w-0 flex-1 pt-[2px]">
        <Rotulo>{chapeu}</Rotulo>
        <Titulo className="mt-[10px]" style={{ fontSize: tam }}>
          {titulo}
        </Titulo>
      </div>
    </div>
    {fina && <p className="em-serif mt-[18px] text-[20px] leading-[1.45]">{fina}</p>}
  </div>
);

const Texto = ({ children, className }: { children: ReactNode; className?: string }) => (
  <p className={`em-sans text-[18px] leading-[1.58] ${className ?? ''}`}>{children}</p>
);

const Fonte = ({ children }: { children: ReactNode }) => (
  <p className="em-sans mt-[10px] text-[12.5px] font-semibold uppercase tracking-[0.14em] opacity-60">{children}</p>
);

const Destaque = ({ children }: { children: ReactNode }) => <b className="text-[var(--em-vinho)]">{children}</b>;

// ── Sumário ─────────────────────────────────────────────────────────────────
export const Sumario = ({ lado }: P) => {
  const { irParaPagina } = useNavegacao();
  return (
    <Pagina lado={lado} numero={2}>
      <div className="absolute inset-x-[64px] bottom-[112px] top-[96px] flex flex-col">
        <Rotulo>Nesta edição</Rotulo>
        <Titulo className="mt-[12px]" style={{ fontSize: 58 }}>A regra é a mesma. O cenário mudou.</Titulo>
        <p className="em-serif mt-[16px] text-[19px] leading-[1.45]">
          Esta edição relembra o que a COF já pede, explica o que a reforma tributária muda na emissão das notas e separa o que é lei do que é boato.
        </p>
        <div className="mt-[18px] grid grid-cols-3 gap-[18px] border-y border-[var(--em-tinta)]/20 py-[12px]">
          {[
            ['1', 'mensagem: nota sobre 100% da receita'],
            ['3', 'números que precisam bater'],
            ['8', 'seções curtas'],
          ].map(([n, t]) => (
            <div key={n}>
              <div className="em-display text-[58px] font-extrabold leading-[0.9] text-[var(--em-vinho)]">{n}</div>
              <div className="em-sans mt-[4px] text-[14.5px] leading-[1.35]">{t}</div>
            </div>
          ))}
        </div>
        <ol className="mt-[14px]">
          {ORDEM_DO_SUMARIO.map((m) => (
            <li key={m.n}>
              <button
                type="button"
                onPointerDown={segura}
                onPointerUp={segura}
                onClick={(e) => {
                  e.stopPropagation();
                  irParaPagina(m.pagina);
                }}
                className="group flex w-full items-center gap-[20px] border-b border-[var(--em-tinta)]/15 py-[7px] text-left"
              >
                <span className="em-display w-[48px] shrink-0 text-[34px] font-extrabold leading-none text-[var(--em-vinho)] transition-transform duration-300 group-hover:translate-x-[6px]">
                  {m.n}
                </span>
                <span className="em-display flex-1 text-[24px] font-semibold uppercase leading-[1.02] transition-colors group-hover:text-[var(--em-vinho)]">
                  {m.titulo}
                </span>
                <span className="em-sans shrink-0 text-[12px] font-bold uppercase tracking-[0.18em] text-[var(--em-vinho)]">{m.tipo}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </Pagina>
  );
};

// ── 01 Editorial ────────────────────────────────────────────────────────────
const E = MATERIAS.editorial;

export const Editorial1 = ({ lado }: P) => (
  <Pagina lado={lado} numero={E.pagina}>
    <div className="absolute inset-x-[64px] bottom-[112px] top-[96px] flex flex-col gap-[18px]">
      <Cabeca n={E.n} chapeu={E.secao} titulo="A conversa que a gente precisa ter" />
      <Texto>
        Emitir nota fiscal sobre toda a receita da unidade nunca foi opcional. Está na lei e está na Circular de Oferta de Franquia que cada
        franqueado assinou: a unidade se compromete a cumprir todas as obrigações fiscais e a declarar à rede todo o faturamento bruto, em
        qualquer forma de pagamento.
      </Texto>
      <Texto>
        Por que falar disso agora? Porque o cenário mudou. Desde 1º de novembro, studios do Simples Nacional emitem NFS-e só pelo{' '}
        <b>Emissor Nacional</b>, e a partir de janeiro essas notas passam a trazer os novos tributos, <b>IBS e CBS</b>. A regra continua a
        mesma; a forma de cumpri-la, não. E a nota é dever de quem presta o serviço, <b>nunca uma escolha de quem paga</b>.
      </Texto>
      <blockquote className="em-display mt-[18px] border-l-[5px] border-[var(--em-vinho)] pl-[24px] text-[46px] font-bold uppercase leading-[0.98]">
        Quem documenta 100% da receita não está só evitando risco. <span className="text-[var(--em-vinho)]">Está habilitando benefícios.</span>
      </blockquote>
    </div>
  </Pagina>
);

export const Editorial2 = ({ lado }: P) => (
  <Pagina lado={lado} numero={E.pagina + 1}>
    <div className="absolute inset-x-[64px] bottom-[112px] top-[96px] grid grid-cols-[1fr_400px] gap-[34px]">
      <div className="flex flex-col gap-[20px] pt-[40px]">
        <Texto>
          Esta edição não foi feita para assustar ninguém. Ela reforça um compromisso que já existe: relembra o que a COF pede, separa o que é
          lei do que é boato de grupo e mostra com números o que está em jogo para a unidade e para a rede.
        </Texto>
        <Texto>
          A regra que vale para o Reformer vale aqui também: <b>método antes do movimento</b>. Primeiro a gente entende; depois a gente ajusta.
        </Texto>
      </div>
      <Foto src={fotoRecepcao} alt="Recepção de um studio Pure Pilates" className="h-[500px] w-[400px] self-start rounded-[10px]" />
    </div>
  </Pagina>
);

// ── 02 Calendário ───────────────────────────────────────────────────────────
const C = MATERIAS.calendario;

type Marco = { data: string; tag: string; agora?: boolean; texto: ReactNode };
const MARCOS: Marco[] = [
  { data: '01/09/2023', tag: 'Em vigor', texto: 'O MEI passa a emitir NFS-e só no Ambiente Nacional, mesmo onde o município não aderiu.' },
  { data: '01/10/2026', tag: 'Em vigor', texto: <>A NFS-e de serviços com ISS passa a informar os campos de <b>IBS e CBS</b>.</> },
  {
    data: '01/11/2026',
    tag: 'Em vigor',
    agora: true,
    texto: (
      <>
        <b>ME e EPP do Simples emitem NFS-e só pelo Emissor Nacional.</b> Os sistemas das prefeituras não autorizam mais essas notas.
      </>
    ),
  },
  {
    data: 'Até 15/12/2026',
    tag: 'Previsto',
    texto: (
      <>
        O Senado deve fixar a alíquota de referência da CBS para 2027. O cálculo aprovado pelo TCU é de <b>11,3%</b>.
      </>
    ),
  },
  {
    data: '01/01/2027',
    tag: 'Cronograma oficial',
    texto: (
      <>
        As notas dos optantes do Simples, NFS-e inclusive, passam a <b>exigir o destaque de IBS e CBS</b>.
      </>
    ),
  },
  {
    data: '2º sem. 2027',
    tag: 'Anunciado',
    texto: (
      <>
        Primeira fase do <b>split payment</b>: facultativa e só entre empresas. Afeta o studio como pagador (royalties, compras), não a
        mensalidade no cartão.
      </>
    ),
  },
  { data: '2029 → 2033', tag: 'Previsto em lei', texto: 'O IBS substitui aos poucos o ISS e o ICMS. Em 2033, o modelo novo está completo.' },
];

const Linha = ({ marcos }: { marcos: Marco[] }) => (
  <div className="relative border-l-2 border-[var(--em-vinho)]/60 pl-[30px]">
    {marcos.map((m) => (
      <div key={m.data} className="relative pb-[22px] last:pb-0">
        <span
          className={`absolute left-[-39px] top-[6px] h-[16px] w-[16px] rounded-full border-[3px] border-[var(--em-vinho)] ${m.agora ? 'bg-[var(--em-vinho)] shadow-[0_0_0_6px_rgba(224,86,107,0.25)]' : 'bg-[#1d1413]'}`}
        />
        <div className="flex flex-wrap items-center gap-[12px]">
          <span className="em-display text-[34px] font-extrabold leading-none">{m.data}</span>
          <span className="em-sans rounded-full border border-current px-[10px] py-[3px] text-[11.5px] font-bold uppercase tracking-[0.16em] opacity-80">
            {m.tag}
          </span>
          {m.agora && <span className="em-sans text-[13px] font-bold uppercase tracking-[0.14em] text-[var(--em-vinho)]">● Você está aqui</span>}
        </div>
        <p className="em-sans mt-[6px] text-[17px] leading-[1.5] opacity-90">{m.texto}</p>
      </div>
    ))}
  </div>
);

export const Calendario1 = ({ lado }: P) => (
  <Pagina lado={lado} numero={C.pagina} tom="escuro">
    <div className="absolute inset-x-[64px] bottom-[112px] top-[96px] flex flex-col gap-[30px]">
      <Cabeca
        n={C.n}
        chapeu={C.secao}
        titulo="O calendário da reforma"
        fina="A obrigação de emitir nota não muda. O que muda é o sistema em que ela é emitida e as informações que ela passa a levar. Veja onde estamos."
      />
      <Linha marcos={MARCOS.slice(0, 4)} />
    </div>
  </Pagina>
);

export const Calendario2 = ({ lado }: P) => (
  <Pagina lado={lado} numero={C.pagina + 1} tom="escuro">
    <div className="absolute inset-x-[64px] bottom-[112px] top-[96px] flex flex-col gap-[34px]">
      <div className="grid grid-cols-[1fr_250px] items-start gap-[30px] pt-[30px]">
        <Linha marcos={MARCOS.slice(4)} />
        <CalendarioNovembro />
      </div>
      <div className="mt-auto rounded-[6px] border-l-[5px] border-[var(--em-vinho)] bg-white/[0.06] px-[30px] py-[26px]">
        <h3 className="em-display text-[40px] font-extrabold uppercase leading-[0.95] text-[var(--em-vinho)]">Cuidado com a falsa folga de 2026</h3>
        <p className="em-sans mt-[12px] text-[17.5px] leading-[1.55]">
          Neste ano, a nota com os campos de IBS/CBS em branco ainda não é rejeitada. Isso <b>não é conformidade</b>. As alíquotas de 2026 são
          de teste (CBS 0,9% e IBS 0,1%), e a dispensa de recolhimento só vale para quem cumpre as obrigações acessórias. Na prática, o governo
          abriu mão de arrecadar em 2026 em troca de dados.
        </p>
      </div>
    </div>
  </Pagina>
);

// ── 03 Mito ou fato ─────────────────────────────────────────────────────────
const M = MATERIAS.mito;

const MITOS: [string, ReactNode][] = [
  [
    '“O aluno pode dispensar a nota.”',
    <>
      <b>Não pode.</b> A lei manda emitir a nota no momento da prestação do serviço. O cliente recebe o documento; não tem o poder de
      dispensá-lo.
    </>,
  ],
  [
    '“Quem não emite leva multa de 300%.”',
    <>
      <b>Essa multa não existe desde 1997.</b> Foi revogada pela Lei 9.532. O risco real é outro, e está na seção 04.
    </>,
  ],
  [
    '“O supercomputador T-Rex da Receita vigia todo Pix.”',
    <>
      <b>É boato.</b> Em nota oficial de abril de 2026, a Receita Federal afirmou que T-Rex e Harpia não monitoram ninguém e que ela não
      rastreia Pix nem notifica contribuintes por movimentação. O ponto que importa para a unidade é outro: <b>o meio de pagamento não muda nada</b>.
      Toda receita, no Pix, no cartão ou em dinheiro, precisa de nota.
    </>,
  ],
  [
    '“Pilates tem redução de 60% como serviço de saúde.”',
    <>
      <b>Não existe esse redutor para Pilates.</b> Existe redução de 60% para <b>fisioterapia</b> e de 30% para{' '}
      <b>profissionais de educação física</b>. Quem conduz a aula define o enquadramento.
    </>,
  ],
  [
    '“O split payment vai reter imposto da mensalidade no cartão.”',
    <>
      <b>A primeira fase deixa cartões de fora.</b> Ela será facultativa e só entre empresas. A mensalidade do aluno pessoa física não entra na
      largada.
    </>,
  ],
  [
    '“Meu município não aderiu, então nada muda.”',
    <>
      <b>Para ME e EPP do Simples, o Emissor Nacional é obrigatório</b> em qualquer município. Mais de 5.500 municípios já estão integrados à
      base nacional.
    </>,
  ],
];

const TabelaMitos = ({ linhas }: { linhas: [string, ReactNode][] }) => (
  <div>
    <div className="em-sans grid grid-cols-[250px_1fr] gap-[28px] border-b-2 border-[var(--em-tinta)] pb-[8px] text-[13px] font-bold uppercase tracking-[0.2em] text-[var(--em-vinho)]">
      <span>O que circula</span>
      <span>O que é real</span>
    </div>
    {linhas.map(([mito, real]) => (
      <div key={mito} className="grid grid-cols-[250px_1fr] gap-[28px] border-b border-[var(--em-tinta)]/20 py-[16px]">
        <div className="flex gap-[10px]">
          <span className="em-display text-[30px] font-extrabold leading-none text-[var(--em-vinho)]">✕</span>
          <s className="em-sans text-[17px] font-semibold leading-[1.45] decoration-[rgba(193,32,48,0.6)] decoration-[1.5px]">{mito}</s>
        </div>
        <p className="em-sans text-[16.5px] leading-[1.5]">{real}</p>
      </div>
    ))}
  </div>
);

export const Mito1 = ({ lado }: P) => (
  <Pagina lado={lado} numero={M.pagina}>
    <div className="absolute inset-x-[64px] bottom-[112px] top-[96px] flex flex-col gap-[26px]">
      <Cabeca
        n={M.n}
        chapeu={M.secao}
        titulo="Seis frases que circulam nos grupos e o que a lei diz de verdade"
        tam={52}
        fina="Um número errado tira a credibilidade de todo o resto. Por isso, antes de qualquer conversa, vale desarmar os boatos."
      />
      <TabelaMitos linhas={MITOS.slice(0, 3)} />
    </div>
  </Pagina>
);

export const Mito2 = ({ lado }: P) => (
  <Pagina lado={lado} numero={M.pagina + 1}>
    <div className="absolute inset-x-[64px] bottom-[112px] top-[96px] flex flex-col pt-[40px]">
      <TabelaMitos linhas={MITOS.slice(3)} />
      <Foto src={fotoStudio} alt="Aula no Cadillac em um studio Pure Pilates" posicao="50% 35%" className="mt-auto h-[300px] w-full rounded-[10px]" />
    </div>
  </Pagina>
);

// ── 04 Riscos ───────────────────────────────────────────────────────────────
const R = MATERIAS.riscos;

const Numerao = ({ valor, unidade, children, fonte }: { valor: string; unidade?: string; children: ReactNode; fonte: string }) => (
  <div className="border-t-[3px] border-[var(--em-vinho)] pt-[14px]">
    <div className="em-display text-[78px] font-extrabold leading-[0.88] text-[var(--em-vinho)]">
      {valor}
      {unidade && <span className="ml-[6px] text-[34px]">{unidade}</span>}
    </div>
    <p className="em-sans mt-[10px] text-[16.5px] leading-[1.5]">{children}</p>
    <Fonte>{fonte}</Fonte>
  </div>
);

export const Riscos1 = ({ lado }: P) => (
  <Pagina lado={lado} numero={R.pagina}>
    <div className="absolute inset-x-[64px] bottom-[112px] top-[96px] flex flex-col gap-[22px]">
      <Cabeca
        n={R.n}
        chapeu={R.secao}
        titulo="Quanto custa ficar fora"
        fina="Sem folclore: estes são os riscos que estão na lei hoje. Todos nascem da mesma coisa, a diferença entre o que a unidade recebeu e o que ela documentou."
      />
      <SemanaAlternada className="mt-auto" />
      <div className="em-tom--vinho px-[36px] py-[26px]">
        <Rotulo className="!text-[#f7ecdc]">Arbitramento</Rotulo>
        <div className="em-display mt-[6px] text-[124px] font-extrabold leading-[0.85]">
          3 <span className="text-[56px]">dias</span>
        </div>
        <p className="em-sans mt-[12px] text-[18px] leading-[1.5]">
          Bastam três dias alternados de movimento para o fisco estimar a receita do mês inteiro: a média vezes os dias de funcionamento. Para
          um studio com agenda no sistema, o cálculo é rápido e totalmente legal.
        </p>
        <Fonte>Lei 8.846/1994, art. 6º</Fonte>
      </div>
    </div>
  </Pagina>
);

export const Riscos2 = ({ lado }: P) => (
  <Pagina lado={lado} numero={R.pagina + 1}>
    <div className="absolute inset-x-[64px] bottom-[112px] top-[96px] grid grid-cols-2 content-center gap-x-[40px] gap-y-[44px]">
      <Numerao valor="75–100" unidade="%" fonte="STF, Tema 863">
        Multa de ofício federal sobre o tributo devido. Chega a 150% só em caso de reincidência.
      </Numerao>
      <Numerao valor="50" unidade="%" fonte="Decreto municipal 53.151/2012 (SP)">
        Do ISS devido, mínimo de R$ 1.144,96, por deixar de emitir NFS-e em São Paulo. Cada município tem a sua tabela.
      </Numerao>
      <Numerao valor="3–10" unidade="anos" fonte="Resolução CGSN 140/2018, art. 84">
        Impedimento de voltar ao Simples Nacional depois de uma exclusão. Despesas acima de 120% do que entrou já disparam o alerta.
      </Numerao>
      <Numerao valor="2–5" unidade="anos" fonte="Lei 8.137/1990, art. 1º, V">
        De reclusão para quem deixa de fornecer nota com o objetivo de reduzir tributo.
      </Numerao>
    </div>
  </Pagina>
);

const DEGRAUS: [string, string][] = [
  ['Aviso', 'Chega pela caixa postal do e-CAC ou pelo Domicílio Tributário Eletrônico.'],
  ['Autorregularização', 'Paga-se tributo e juros, com multa menor.'],
  ['Auto de infração', 'Multa de ofício de 75% a 100%, mais Selic.'],
  ['Exclusão do Simples', 'Efeito desde o mês da ocorrência.'],
  ['Esfera penal', 'Pagar tudo extingue a punibilidade, mas exige caixa para tributo, multa e Selic.'],
];

export const Riscos3 = ({ lado }: P) => (
  <Pagina lado={lado} numero={R.pagina + 2}>
    <div className="absolute inset-x-[64px] bottom-[112px] top-[96px] flex flex-col">
      <Titulo style={{ fontSize: 58 }}>A escada do risco: sempre há um aviso antes</Titulo>
      <p className="em-serif mt-[16px] text-[19px] leading-[1.45]">
        O pequeno prestador é alcançado por malha automática, não por blitz. Cada degrau é mais caro que o anterior, e o primeiro é sempre a
        melhor hora de agir.
      </p>
      <div className="mt-auto grid grid-cols-5 items-end gap-[12px]">
        {DEGRAUS.map(([nome], i) => (
          <div
            key={nome}
            className="flex flex-col justify-between bg-[var(--em-vinho)] p-[12px] text-[#f7ecdc]"
            style={{ height: 70 + i * 62, opacity: 0.55 + i * 0.11 }}
          >
            <span className="em-display text-[34px] font-extrabold leading-none">{i + 1}</span>
            <span className="em-sans text-[13px] font-bold uppercase leading-[1.2] tracking-[0.06em]">{nome}</span>
          </div>
        ))}
      </div>
      <div className="h-[3px] bg-[var(--em-tinta)]" />
      <div className="mt-[14px] grid grid-cols-5 gap-[12px]">
        {DEGRAUS.map(([nome, legenda]) => (
          <p key={nome} className="em-sans text-[13.5px] leading-[1.4]">
            {legenda}
          </p>
        ))}
      </div>
    </div>
  </Pagina>
);

export const Riscos4 = ({ lado }: P) => (
  <Pagina lado={lado} numero={R.pagina + 3} tom="escuro">
    <div className="absolute inset-x-[64px] bottom-[112px] top-[96px] flex flex-col justify-center">
      <Rotulo>Caso real · Maranhão</Rotulo>
      <div className="em-display mt-[8px] text-[190px] font-extrabold leading-[0.82] text-[var(--em-vinho)]">4.578</div>
      <p className="em-sans mt-[16px] text-[24px] font-medium leading-[1.35]">
        empresas do Simples deixaram de declarar mais de <Destaque>R$ 1,3 bilhão</Destaque> em faturamento.
      </p>
      <div className="mt-[30px] h-[3px] w-[64px] bg-[var(--em-vinho)]" />
      <Texto className="mt-[24px]">
        Não foi supercomputador nem rastreamento de Pix pela Receita Federal. A Secretaria da Fazenda do Maranhão comparou dois documentos
        oficiais: o relatório mensal que as administradoras de cartão e instituições de pagamento entregam ao estado (a DIMP) e o faturamento
        que as próprias empresas declararam no Simples, entre 2021 e 2022. Onde o primeiro era maior, a diferença virou base de cobrança. Antes
        da autuação, houve aviso e prazo para regularizar.
      </Texto>
      <p className="em-sans mt-[16px] text-[15px] leading-[1.5] opacity-75">
        Não há, até agora, caso público de autuação de studio de Pilates. O caso mostra o método: documento contra documento.
      </p>
    </div>
  </Pagina>
);

// ── 05 Na prática ───────────────────────────────────────────────────────────
const PR = MATERIAS.pratica;

const PASSOS: [string, string, string][] = [
  ['01', 'Aluno ativo no mês', 'Toda mensalidade do período entra, qualquer que seja a forma de pagamento.'],
  ['02', 'Mês de competência', 'Vale o mês em que a aula foi dada, não o mês em que o pagamento caiu.'],
  ['03', 'NFS-e no Emissor Nacional', 'Com o aluno identificado como tomador, pelo valor da mensalidade.'],
  ['04', 'Campos de IBS e CBS', 'Preenchidos já. Em janeiro de 2027 passam a ser exigidos.'],
  ['05', 'Informe à rede', 'O sistema da rede consolida o faturamento que gera o royalty.'],
];

export const Pratica1 = ({ lado }: P) => (
  <Pagina lado={lado} numero={PR.pagina}>
    <div className="absolute inset-x-[64px] bottom-[112px] top-[96px] flex flex-col gap-[20px]">
      <Cabeca
        n={PR.n}
        chapeu={PR.secao}
        titulo="Uma nota por aluno, por mês"
        fina="Em contrato de mensalidade, o serviço é o mês inteiro, não cada aula. Por isso a lógica é simples: cada aluno ativo recebe uma NFS-e pelo mês de competência."
      />
      <div>
        {PASSOS.map(([n, titulo, texto]) => (
          <div key={n} className="flex gap-[22px] border-b border-[var(--em-tinta)]/20 py-[12px]">
            <div className="em-display w-[60px] shrink-0 text-[50px] font-extrabold leading-[0.95] text-[var(--em-vinho)]">{n}</div>
            <div>
              <div className="em-display text-[29px] font-extrabold uppercase leading-[1]">{titulo}</div>
              <p className="em-sans mt-[4px] text-[16px] leading-[1.42]">{texto}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </Pagina>
);

const Lista = ({ titulo, itens, sim }: { titulo: string; itens: string[]; sim: boolean }) => (
  <div className={`border-t-[4px] pt-[14px] ${sim ? 'border-[#3f7d4e]' : 'border-[var(--em-vinho)]'}`}>
    <h4 className={`em-display text-[36px] font-extrabold uppercase leading-none ${sim ? 'text-[#3f7d4e]' : 'text-[var(--em-vinho)]'}`}>{titulo}</h4>
    <ul className="mt-[10px] space-y-[8px]">
      {itens.map((i) => (
        <li key={i} className="em-sans flex gap-[10px] text-[16px] leading-[1.42]">
          <span className={`shrink-0 font-bold ${sim ? 'text-[#3f7d4e]' : 'text-[var(--em-vinho)]'}`}>{sim ? '✓' : '✕'}</span>
          <span>{i}</span>
        </li>
      ))}
    </ul>
  </div>
);

export const Pratica2 = ({ lado }: P) => (
  <Pagina lado={lado} numero={PR.pagina + 1}>
    <div className="absolute inset-x-[64px] bottom-[112px] top-[96px] flex flex-col gap-[26px]">
      <div className="grid grid-cols-2 gap-[34px] pt-[20px]">
        <Lista
          titulo="Pode"
          sim
          itens={[
            'Uma nota por aluno, por mês, com CPF do tomador',
            'RPS com conversão em lote em dias de muito volume, convertido até o 10º dia',
            'Nota de fisioterapia só quando o fisioterapeuta presta o serviço',
          ]}
        />
        <Lista
          titulo="Não pode"
          sim={false}
          itens={[
            'Nota única do mês, sem tomador',
            'Nota emitida contra o CNPJ da própria unidade',
            'RPS que passou do prazo: perde a validade para todos os fins',
          ]}
        />
      </div>
      <div className="relative mt-auto h-[400px]">
        <Foto src={fotoGestao} alt="Studio Pure Pilates com os aparelhos" className="absolute left-0 top-0 h-[400px] w-[470px] rounded-[10px]" />
        <NotaFiscal className="absolute right-0 top-[24px] w-[300px]" style={{ rotate: '3deg' }} />
      </div>
    </div>
  </Pagina>
);

// ── 06 Três números ─────────────────────────────────────────────────────────
const N = MATERIAS.numeros;

export const Numeros1 = ({ lado }: P) => (
  <Pagina lado={lado} numero={N.pagina} tom="escuro">
    <div className="absolute inset-x-[64px] bottom-[112px] top-[96px] flex flex-col gap-[34px]">
      <Cabeca
        n={N.n}
        chapeu={N.secao}
        titulo="Três números que deveriam ser o mesmo"
        tam={60}
        fina="É a conta que a própria fiscalização faria, e é por ela que a rede começa: unidade por unidade, mês a mês."
      />
      <div className="mt-auto flex flex-col items-stretch gap-[10px]">
        {[
          ['Faturamento no sistema da rede', 'o que a unidade vendeu'],
          ['NFS-e emitidas', 'o que a prefeitura e a Receita enxergam'],
          ['Royalty ÷ percentual', 'o que a nota da franqueadora registra'],
        ].map(([t, s], i) => (
          <div key={t}>
            {i > 0 && <div className="em-display py-[2px] text-center text-[48px] font-extrabold leading-none text-[var(--em-vinho)]">=</div>}
            <div className="rounded-full border-2 border-[var(--em-vinho)] px-[34px] py-[16px] text-center">
              <div className="em-display text-[34px] font-extrabold uppercase leading-none">{t}</div>
              <div className="em-sans mt-[4px] text-[15px] opacity-80">{s}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </Pagina>
);

const Barra = ({ rotulo, largura, valor, diverge }: { rotulo: string; largura: number; valor: string; diverge?: boolean }) => (
  <div className="grid grid-cols-[110px_1fr_92px] items-center gap-[14px] py-[6px]">
    <span className="em-sans text-[14.5px] font-semibold">{rotulo}</span>
    <div className="h-[14px] bg-[var(--em-tinta)]/10">
      <div className={`h-full ${diverge ? 'bg-[#e0566b]' : 'bg-[var(--em-vinho)]'}`} style={{ width: `${largura}%` }} />
    </div>
    <em className="em-sans text-right text-[15px] font-bold not-italic">{valor}</em>
  </div>
);

const Unidade = ({ nome, selo, ok, nfse, nfseL, nota }: { nome: string; selo: string; ok: boolean; nfse: string; nfseL: number; nota: string }) => (
  <div className="border-t-[3px] border-[var(--em-tinta)] pt-[14px]">
    <h4 className="em-display flex items-center gap-[14px] text-[38px] font-extrabold uppercase leading-none">
      {nome}
      <span
        className={`em-sans rounded-full px-[12px] py-[4px] text-[12px] font-bold uppercase tracking-[0.16em] text-white ${ok ? 'bg-[#3f7d4e]' : 'bg-[var(--em-vinho)]'}`}
      >
        {selo}
      </span>
    </h4>
    <div className="mt-[12px]">
      <Barra rotulo="Sistema" largura={100} valor="R$ 80 mil" />
      <Barra rotulo="NFS-e" largura={nfseL} valor={nfse} diverge={!ok} />
      <Barra rotulo="Royalty ÷ %" largura={100} valor="R$ 80 mil" />
    </div>
    <p className="em-sans mt-[10px] text-[16px] leading-[1.45]">{nota}</p>
  </div>
);

export const Numeros2 = ({ lado }: P) => (
  <Pagina lado={lado} numero={N.pagina + 1}>
    <div className="absolute inset-x-[64px] bottom-[112px] top-[96px] flex flex-col justify-center gap-[46px]">
      <Unidade nome="Unidade A" selo="Em dia" ok nfse="R$ 80 mil" nfseL={100} nota="Os três números batem. Não há programa a implantar: só manter." />
      <Unidade
        nome="Unidade B"
        selo="Divergência"
        ok={false}
        nfse="R$ 52 mil"
        nfseL={65}
        nota="A diferença de R$ 28 mil já está registrada em dois lugares: no sistema e na nota de royalty."
      />
      <p className="em-sans text-[13.5px] opacity-65">Valores ilustrativos.</p>
    </div>
  </Pagina>
);

export const Numeros3 = ({ lado }: P) => (
  <Pagina lado={lado} numero={N.pagina + 2}>
    <div className="absolute inset-x-[64px] bottom-[112px] top-[96px] flex flex-col justify-center gap-[50px]">
      <div>
        <Titulo className="border-b-2 border-[var(--em-tinta)] pb-[12px]" style={{ fontSize: 50 }}>Por que o royalty é uma trilha</Titulo>
        <Texto className="mt-[16px]">
          O ISS incide sobre franquia (STF, Tema 300). Por isso, a franqueadora emite NFS-e do royalty, e essa nota vai para o mesmo repositório
          nacional. Se o royalty é um percentual do faturamento, a nota dele revela, por conta simples, quanto a unidade faturou. Não existe
          versão limpa de declarar um número à rede e outro ao fisco.
        </Texto>
      </div>
      <div className="em-tom--vinho px-[34px] py-[30px]">
        <Titulo style={{ fontSize: 50 }}>A rede também faz a parte dela</Titulo>
        <Texto className="mt-[14px]">
          Adequação é via de mão dupla. A franqueadora cuida da própria conformidade, emite corretamente as notas de royalty e mantém a Circular
          de Oferta de Franquia (COF) e os contratos alinhados ao que pede. É isso que dá legitimidade ao padrão que a rede propõe para todas as
          unidades.
        </Texto>
      </div>
    </div>
  </Pagina>
);

/** Página de foto inteira (fecha uma seção com número ímpar de páginas). */
const FotoInteira = ({ lado, numero, src, alt, posicao }: P & { numero: number; src: string; alt: string; posicao?: string }) => (
  <Pagina lado={lado} numero={numero} tom="escuro" folioCurto>
    <img src={src} alt={alt} draggable={false} className="absolute inset-0 h-full w-full select-none object-cover" style={{ objectPosition: posicao }} />
  </Pagina>
);

export const Numeros4 = ({ lado }: P) => (
  <FotoInteira lado={lado} numero={N.pagina + 3} src={fotoAulao1} alt="Aula em um studio Pure Pilates" posicao="50% 40%" />
);

// ── 07 Ganhos ───────────────────────────────────────────────────────────────
const G = MATERIAS.ganhos;

const Enquadramento = ({
  quem,
  conselho,
  codigo,
  reducao,
  reducaoNota,
  deduz,
  deduzNota,
  sim,
}: {
  quem: string;
  conselho: string;
  codigo: string;
  reducao: string;
  reducaoNota: string;
  deduz: string;
  deduzNota: string;
  sim: boolean;
}) => (
  <div className="border-t-[3px] border-[var(--em-vinho)] pt-[12px]">
    <div className="em-display text-[34px] font-extrabold uppercase leading-none">{quem}</div>
    <div className="mt-[12px] grid grid-cols-4 gap-[16px]">
      <div>
        <div className="em-sans text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--em-vinho)]">Conselho</div>
        <div className="em-sans mt-[4px] text-[16px] font-semibold">{conselho}</div>
      </div>
      <div>
        <div className="em-sans text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--em-vinho)]">Item LC 116 · CNAE</div>
        <div className="em-sans mt-[4px] text-[16px] font-semibold">{codigo}</div>
      </div>
      <div>
        <div className="em-sans text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--em-vinho)]">Redução de IBS/CBS</div>
        <div className="em-display mt-[2px] text-[40px] font-extrabold leading-none text-[var(--em-vinho)]">{reducao}</div>
        <div className="em-sans mt-[4px] text-[12.5px] leading-[1.35] opacity-75">{reducaoNota}</div>
      </div>
      <div>
        <div className="em-sans text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--em-vinho)]">Aluno deduz no IR?</div>
        <div className={`em-display mt-[2px] text-[40px] font-extrabold leading-none ${sim ? 'text-[var(--em-vinho)]' : ''}`}>{deduz}</div>
        <div className="em-sans mt-[4px] text-[12.5px] leading-[1.35] opacity-75">{deduzNota}</div>
      </div>
    </div>
  </div>
);

export const Ganhos1 = ({ lado }: P) => (
  <Pagina lado={lado} numero={G.pagina}>
    <div className="absolute inset-x-[64px] bottom-[112px] top-[96px] flex flex-col gap-[28px]">
      <Cabeca
        n={G.n}
        chapeu={G.secao}
        titulo="Quem conduz a aula define o enquadramento"
        tam={56}
        fina="O critério é quem presta o serviço, não o nome “Pilates”. E quem emite nota corretamente abre portas que quem não emite fecha sozinho."
      />
      <div className="em-sans text-[12.5px] font-bold uppercase tracking-[0.2em] opacity-70">Quem conduz a aula</div>
      <Enquadramento
        quem="Fisioterapeuta"
        conselho="CREFITO"
        codigo="4.08 · 8650-0/04"
        reducao="60%"
        reducaoNota="Serviços de fisioterapia, Anexo III da LC 214/2025"
        deduz="Sim"
        deduzNota="Receita Federal, SC Cosit 32/2024"
        sim
      />
      <Enquadramento
        quem="Profissional de educação física"
        conselho="CREF"
        codigo="6.04 · 9313-1/00"
        reducao="30%"
        reducaoNota="Art. 127, X, LC 214/2025. A PJ precisa de registro no conselho e de apuração fora do DAS"
        deduz="Não"
        deduzNota="Atividade física não é despesa médica"
        sim={false}
      />
    </div>
  </Pagina>
);

const GANHOS: [string, string][] = [
  ['Redutor de 30%', 'Disponível para a unidade com registro no CREF que apura fora do DAS. Sem nota, não há o que reduzir.'],
  ['Aluno com dedução', 'Quando o fisioterapeuta conduz a sessão, a nota correta vale como despesa dedutível para o aluno.'],
  ['Crédito nas compras', 'No regime regular, a nota das próprias compras, como os aparelhos, pode gerar crédito.'],
  ['Histórico cooperativo', 'Os programas de conformidade dão prazo extra para quem demonstra boa conduta. Quem nunca emitiu não tem histórico para mostrar.'],
];

export const Ganhos2 = ({ lado }: P) => (
  <Pagina lado={lado} numero={G.pagina + 1}>
    <div className="absolute inset-x-[64px] bottom-[112px] top-[96px] grid grid-cols-2 content-center gap-[30px]">
      {GANHOS.map(([t, p], i) => (
        <div key={t} className={`${i === 0 || i === 3 ? 'em-tom--vinho' : 'bg-[var(--em-papel-2)]'} px-[26px] py-[30px]`}>
          <div className="em-display text-[60px] font-extrabold leading-none opacity-40">{String(i + 1).padStart(2, '0')}</div>
          <h4 className="em-display mt-[10px] text-[36px] font-extrabold uppercase leading-[0.95]">{t}</h4>
          <p className="em-sans mt-[12px] text-[16.5px] leading-[1.48]">{p}</p>
        </div>
      ))}
    </div>
  </Pagina>
);

export const Ganhos3 = ({ lado }: P) => (
  <Pagina lado={lado} numero={G.pagina + 2}>
    <div className="absolute inset-x-[64px] bottom-[112px] top-[96px] flex flex-col gap-[30px]">
      <Foto src={fotoAula} alt="Aula no Reformer em um studio Pure Pilates" className="h-[389px] w-full rounded-[10px]" />
      <blockquote className="em-display border-l-[5px] border-[var(--em-vinho)] pl-[24px] text-[50px] font-bold uppercase leading-[0.98]">
        Emitir tudo sob um único código, sem olhar quem dá a aula, <span className="text-[var(--em-vinho)]">é risco em dobro.</span>
      </blockquote>
      <Texto>
        Uma unidade com fisioterapeutas e outra com educadores físicos têm, na prática, enquadramentos diferentes. O código da nota precisa
        refletir a equipe real, e o emissor de São Paulo já rejeita notas com código incompatível.
      </Texto>
    </div>
  </Pagina>
);

export const Ganhos4 = ({ lado }: P) => (
  <FotoInteira lado={lado} numero={G.pagina + 3} src={fotoAulao2} alt="Aula no Barrel em um studio Pure Pilates" posicao="50% 45%" />
);

// ── 08 Padrão da rede ───────────────────────────────────────────────────────
const PD = MATERIAS.padrao;

const Clausula = ({ no, titulo, children, cinza }: { no: string; titulo: string; children: ReactNode; cinza?: boolean }) => (
  <div className={`border-t-[3px] pt-[10px] ${cinza ? 'border-[var(--em-tinta)]/40' : 'border-[var(--em-vinho)]'}`}>
    <div className={`em-sans text-[12px] font-bold uppercase tracking-[0.18em] ${cinza ? 'opacity-60' : 'text-[var(--em-vinho)]'}`}>{no}</div>
    <h4 className="em-display mt-[4px] text-[28px] font-extrabold uppercase leading-[0.98]">{titulo}</h4>
    <p className="em-sans mt-[6px] text-[15px] leading-[1.45]">{children}</p>
  </div>
);

export const Padrao1 = ({ lado }: P) => (
  <Pagina lado={lado} numero={PD.pagina}>
    <div className="absolute inset-x-[64px] bottom-[112px] top-[96px] flex flex-col gap-[24px]">
      <Cabeca
        n={PD.n}
        chapeu={PD.secao}
        titulo="A obrigação já está na sua COF"
        tam={60}
        fina="Nada nesta edição é regra nova. A Circular de Oferta e o contrato que você assinou já pedem obrigações fiscais em dia e todo o faturamento declarado à rede. Com a reforma tributária, a rede reforça esse compromisso e organiza como ele será acompanhado."
      />
      <Rotulo>O que a COF e o contrato já pedem</Rotulo>
      <div className="grid grid-cols-2 gap-x-[32px] gap-y-[20px]">
        <Clausula no="Cláusula 1ª" titulo="Faturamento bruto é tudo">
          Todas as receitas, presenciais ou virtuais, em qualquer forma de pagamento, sem deduções. É a base dos royalties (8%) e da taxa de
          publicidade (2%).
        </Clausula>
        <Clausula no="Cláusula 4ª" titulo="Obrigações fiscais em dia">
          A unidade comprova o pagamento de tributos quando a rede pedir. Descumprir obrigações fiscais pode levar à rescisão por justa causa.
        </Clausula>
        <Clausula no="Cláusula 9.5" titulo="Software de gestão homologado">
          Uso obrigatório do sistema da rede. O uso irregular é falha grave.
        </Clausula>
        <Clausula no="Cláusula 7.4" titulo="Registros contábeis guardados">
          Completos e precisos durante o contrato e por cinco anos depois do fim, com acesso para inspeção.
        </Clausula>
      </div>
    </div>
  </Pagina>
);

export const Padrao2 = ({ lado }: P) => (
  <Pagina lado={lado} numero={PD.pagina + 1}>
    <div className="absolute inset-x-[64px] bottom-[112px] top-[96px] flex flex-col gap-[22px]">
      <div className="grid grid-cols-2 gap-x-[32px] gap-y-[20px] pt-[20px]">
        <Clausula no="Cláusula 10.3" titulo="Auditoria de livros e sistema">
          A franqueadora pode auditar, diretamente ou por terceiros, os livros contábeis e o sistema da unidade.
        </Clausula>
        <Clausula no="Cláusulas 10.4 e 19ª" titulo="Informação fiel à rede">
          Omitir ou subfaturar informações à franqueadora é falha grave (R$ 1.000 por infração) e motivo de rescisão.
        </Clausula>
      </div>
      <Rotulo className="mt-[22px]">Como a rede vai reforçar · próximos passos</Rotulo>
      <div className="flex flex-col gap-[18px]">
        <Clausula no="Orientação" titulo="Uma NFS-e por aluno, por mês" cinza>
          O jeito de cumprir a obrigação no novo sistema: emissão no Emissor Nacional, com o aluno identificado.
        </Clausula>
        <Clausula no="Orientação" titulo="Sistema como fonte do faturamento" cinza>
          O que entra no sistema gera nota, royalty e relatório, com informe mensal no mesmo formato.
        </Clausula>
        <Clausula no="Acompanhamento" titulo="Reconciliação mensal" cinza>
          Sistema × notas × royalties, com regras claras sobre aviso prévio, prazos e o que acontece se houver divergência.
        </Clausula>
      </div>
    </div>
  </Pagina>
);

const PERGUNTAS = [
  'Minha unidade emite pelo Emissor Nacional desde 1º/11.',
  'Cada aluno ativo recebe uma NFS-e por mês, com CPF.',
  'Os campos de IBS e CBS estão prontos para janeiro de 2027.',
  'Sei quem conduz as aulas (CREF ou CREFITO) e uso o código certo.',
  'O faturamento do sistema bate com as notas emitidas.',
  'Avaliei o regime (DAS ou regular) com o contador. A próxima janela é em março de 2027.',
  'Leio a caixa postal do e-CAC e do Domicílio Tributário Eletrônico.',
];

const MENSAGENS = [
  'Marque o que já está em dia. Nada é enviado: o checklist é só seu.',
  'Bom começo. Leve os itens em aberto para a próxima conversa com o contador.',
  'Mais da metade em dia. Falta pouco.',
  'Unidade em dia. É assim que a rede inteira fica protegida.',
];

export const Checklist = ({ lado }: P) => {
  const [marcadas, setMarcadas] = useState<boolean[]>(() => PERGUNTAS.map(() => false));
  const n = marcadas.filter(Boolean).length;
  const msg = n === 0 ? MENSAGENS[0] : n < 4 ? MENSAGENS[1] : n < 7 ? MENSAGENS[2] : MENSAGENS[3];
  return (
    <Pagina lado={lado} numero={PD.pagina + 2}>
      <div className="absolute inset-x-[64px] bottom-[112px] top-[96px] flex flex-col">
        <Rotulo>Checklist da unidade</Rotulo>
        <Titulo className="mt-[10px]" style={{ fontSize: 50 }}>Sete perguntas para responder com o seu contador</Titulo>
        <ul className="mt-[18px]">
          {PERGUNTAS.map((p, i) => (
            <li key={p} className="border-b border-[var(--em-tinta)]/15">
              <label
                className="em-sans flex cursor-pointer items-start gap-[14px] py-[9px] text-[16.5px] leading-[1.4]"
                onPointerDown={segura}
                onPointerUp={segura}
                onClick={segura}
              >
                <input
                  type="checkbox"
                  checked={marcadas[i]}
                  onChange={() => setMarcadas((m) => m.map((v, j) => (j === i ? !v : v)))}
                  className="mt-[2px] h-[20px] w-[20px] shrink-0 accent-[#a9293b]"
                />
                <span className={marcadas[i] ? 'opacity-60' : ''}>{p}</span>
              </label>
            </li>
          ))}
        </ul>
        <div className="em-tom--escuro mt-[18px] px-[28px] py-[18px]">
          <div className="flex items-end justify-between gap-[20px]">
            <div>
              <div className="em-sans text-[12px] font-bold uppercase tracking-[0.2em] opacity-75">Sua unidade</div>
              <div className="em-display text-[64px] font-extrabold leading-none">
                {n}
                <small className="text-[28px]">/7</small>
              </div>
            </div>
            <p className="em-sans max-w-[400px] text-right text-[15px] leading-[1.4]">{msg}</p>
          </div>
          <div className="mt-[10px] h-[8px] bg-white/15">
            <div className="h-full bg-[#e0566b] transition-all duration-500" style={{ width: `${(n / 7) * 100}%` }} />
          </div>
        </div>
        <div className="mt-auto grid grid-cols-3 gap-[18px]">
          {[
            ['Até 15/12', 'O Senado define a alíquota de referência da CBS para 2027.'],
            ['01/01/2027', 'Notas do Simples passam a exigir IBS e CBS.'],
            ['Março/2027', 'Nova janela para optar pelo regime regular, com efeito no 2º semestre.'],
          ].map(([d, t]) => (
            <div key={d} className="border-t-[3px] border-[var(--em-vinho)] pt-[8px]">
              <b className="em-display text-[28px] font-extrabold leading-none text-[var(--em-vinho)]">{d}</b>
              <p className="em-sans mt-[4px] text-[14px] leading-[1.38]">{t}</p>
            </div>
          ))}
        </div>
      </div>
    </Pagina>
  );
};

const FONTES = [
  'Lei 8.846/1994 e Lei 9.532/1997, Câmara dos Deputados',
  'Lei 8.137/1990, SEF/MG',
  'Lei 13.966/2019 (Lei de Franquias), Câmara dos Deputados',
  'LC 214/2025, art. 127 e Anexo III; LC 227/2026',
  'Resolução CGSN 191/2026, CRC-MS',
  'Cronograma do Ato Conjunto RFB/CGIBS 4/2026, CGIBS',
  'STF, Tema 863 (RE 736.090) e Tema 300 (RE 603.136)',
  'Resolução CGSN 140/2018 e Manual de Exclusão do Simples, Receita Federal',
  'Decreto 53.151/2012 e Manual DOC-DIMP, Prefeitura de São Paulo',
  'SC SF/DEJUG 10/2025 e Orientações sobre RPS, Prefeitura de São Paulo',
  'Perguntas e respostas da e-Financeira, Receita Federal',
  'SC Cosit 32/2024, resumo do IBET',
  'Sefaz-MA e DIMP, via netCPA',
  'Nota oficial da Receita Federal sobre Pix, T-Rex e Harpia, Secom/gov.br e Agência Gov, 20/04/2026',
  'Split payment, Convergência Digital; alíquota da CBS, O Povo e Migalhas',
];

export const Fontes = ({ lado }: P) => (
  <Pagina lado={lado} numero={PD.pagina + 3}>
    <div className="absolute inset-x-[64px] bottom-[112px] top-[96px] flex flex-col gap-[22px]">
      <div>
        <h4 className="em-sans text-[13px] font-bold uppercase tracking-[0.2em] text-[var(--em-vinho)]">Fontes principais</h4>
        <ol className="em-sans mt-[8px] list-decimal columns-2 gap-[28px] pl-[20px] text-[12.5px] leading-[1.38]">
          {FONTES.map((f) => (
            <li key={f} className="mb-[4px] break-inside-avoid">
              {f}
            </li>
          ))}
        </ol>
      </div>
      <p className="em-sans mt-auto border-t border-[var(--em-tinta)]/20 pt-[12px] text-[12.5px] leading-[1.45] opacity-75">
        Conteúdo educativo, produzido a partir de levantamento de legislação e fontes especializadas até novembro de 2026. Não substitui a
        orientação do contador e do jurídico. Valores de multa variam por município; os de São Paulo são exemplo. Itens marcados como previstos
        ou anunciados ainda não são lei em vigor.
      </p>
    </div>
  </Pagina>
);
