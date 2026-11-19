import { Fragment, useState, type ReactNode, type SyntheticEvent } from 'react';
import { BarChart3, FileText, ImagePlus, MessageCircleQuestion, Scale, SlidersHorizontal, Tag, Type, Wand2 } from 'lucide-react';
import { MotionPureGpt } from './MotionPureGpt';
import { Pagina, Rotulo, Titulo, useNavegacao, type Lado } from '../diagramacao';
import posterPodcast from './fotos/podcast-poster.jpg';
import {
  BoatoLei,
  CalendarioNovembro,
  LequeDeNotas,
  SemanaAlternada,
} from './Ilustracoes';
import douglas from '../edicao-1/fotos/douglas-recorte.png';
import { MATERIAS, ORDEM_DO_SUMARIO, PURE_GPT, RECONHECIMENTO } from './materias';

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
        <Titulo className="mt-[10px]" style={{ fontSize: 50 }}>A regra é a mesma. O cenário mudou.</Titulo>
        <p className="em-serif mt-[12px] text-[18px] leading-[1.4]">
          Esta edição relembra o que a COF já pede, explica o que a reforma tributária muda na emissão das notas e separa o que é lei do que é boato.
        </p>
        <div className="mt-[14px] grid grid-cols-3 gap-[18px] border-y border-[var(--em-tinta)]/20 py-[8px]">
          {[
            ['1', 'mensagem: nota sobre 100% da receita'],
            ['3', 'números que precisam bater'],
            ['7', 'seções curtas'],
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
                className="group flex w-full items-center gap-[20px] border-b border-[var(--em-tinta)]/15 py-[5px] text-left"
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
        <button
          type="button"
          onPointerDown={segura}
          onPointerUp={segura}
          onClick={(e) => {
            e.stopPropagation();
            irParaPagina(PURE_GPT.pagina);
          }}
          className="em-tom--vinho group mt-[12px] flex w-full items-center gap-[16px] px-[16px] py-[10px] text-left"
        >
          <span className="em-sans shrink-0 rounded-full bg-[#f7ecdc] px-[10px] py-[3px] text-[11px] font-bold uppercase tracking-[0.18em] text-[#a9293b]">
            {PURE_GPT.tipo}
          </span>
          <span className="em-display flex-1 text-[24px] font-semibold uppercase leading-[1.02]">
            {PURE_GPT.secao}: {PURE_GPT.chamada}
          </span>
          <span className="em-sans text-[13px] font-bold tracking-[0.14em]">P. {PURE_GPT.pagina}</span>
        </button>
        <button
          type="button"
          onPointerDown={segura}
          onPointerUp={segura}
          onClick={(e) => {
            e.stopPropagation();
            irParaPagina(RECONHECIMENTO.pagina);
          }}
          className="em-tom--escuro mt-[8px] flex w-full items-center gap-[16px] px-[16px] py-[10px] text-left"
        >
          <span className="em-sans shrink-0 rounded-full bg-[#f7ecdc] px-[10px] py-[3px] text-[11px] font-bold uppercase tracking-[0.18em] text-[#1d1413]">
            Reconhecimento
          </span>
          <span className="em-display flex-1 text-[24px] font-semibold uppercase leading-[1.02]">
            {RECONHECIMENTO.secao}: {RECONHECIMENTO.titulo}
          </span>
          <span className="em-sans text-[13px] font-bold tracking-[0.14em]">P. {RECONHECIMENTO.pagina}</span>
        </button>
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

/** Infográfico do editorial: o que a edição faz (com as páginas) e o método. */
const InfoEdicao = () => {
  const itens = [
    { Icone: FileText, t: 'Relembra o que a COF pede', p: `P. ${MATERIAS.padrao.pagina}` },
    { Icone: Scale, t: 'Separa o que é lei do que é boato', p: `P. ${String(MATERIAS.mito.pagina).padStart(2, '0')}` },
    { Icone: BarChart3, t: 'Mostra com números o que está em jogo', p: `PP. ${String(MATERIAS.riscos.pagina).padStart(2, '0')} e ${MATERIAS.numeros.pagina}` },
  ];
  return (
    <div aria-hidden="true" className="flex flex-col gap-[14px] self-center">
      <Rotulo>Esta edição</Rotulo>
      <div className="relative flex flex-col gap-[12px] border-l-[3px] border-[var(--em-vinho)] pl-[22px]">
        {itens.map(({ Icone, t, p }) => (
          <div key={t} className="relative flex items-center gap-[14px] rounded-[10px] bg-white/60 px-[14px] py-[12px] shadow-[0_6px_18px_-10px_rgba(0,0,0,0.3)]">
            <span className="absolute left-[-31px] top-1/2 h-[14px] w-[14px] -translate-y-1/2 rounded-full border-[3px] border-[var(--em-vinho)] bg-[var(--em-papel)]" />
            <span className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-[var(--em-vinho)] text-[#f7ecdc]">
              <Icone className="h-[22px] w-[22px]" strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="em-display block text-[22px] font-extrabold uppercase leading-[1]">{t}</span>
              <span className="em-sans mt-[3px] block text-[12px] font-bold tracking-[0.14em] text-[var(--em-vinho)]">{p}</span>
            </span>
          </div>
        ))}
      </div>
      <div className="mt-[14px] rounded-[10px] bg-[var(--em-tinta)] px-[18px] py-[16px] text-[#f7ecdc]">
        <div className="em-sans text-[11.5px] font-bold uppercase tracking-[0.2em] text-[#e0566b]">Método antes do movimento</div>
        <div className="mt-[10px] grid grid-cols-[1fr_auto_1fr] items-center gap-[10px]">
          <div className="rounded-[8px] border border-white/20 px-[12px] py-[10px] text-center">
            <div className="em-display text-[30px] font-extrabold leading-none text-[#e0566b]">1</div>
            <div className="em-display mt-[2px] text-[22px] font-extrabold uppercase leading-none">Entender</div>
          </div>
          <span className="em-display text-[30px] font-extrabold text-[#e0566b]">→</span>
          <div className="rounded-[8px] bg-[#e0566b] px-[12px] py-[10px] text-center text-white">
            <div className="em-display text-[30px] font-extrabold leading-none">2</div>
            <div className="em-display mt-[2px] text-[22px] font-extrabold uppercase leading-none">Ajustar</div>
          </div>
        </div>
      </div>
    </div>
  );
};

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
      <InfoEdicao />
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
        titulo="Cinco frases que circulam nos grupos e o que a lei diz de verdade"
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
      <BoatoLei className="mt-auto h-[300px] w-full" />
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
      <div className="relative mb-[30px] mt-auto h-[370px]">
        <LequeDeNotas className="absolute inset-0" />
      </div>
    </div>
  </Pagina>
);

// ── 06 Três números ─────────────────────────────────────────────────────────
const N = MATERIAS.numeros;

// Abre a seção (página ímpar): o alerta da nota de royalty. Texto enviado pelo time em 18/11/2026.
export const NumerosAbertura = ({ lado }: P) => (
  <Pagina lado={lado} numero={N.pagina} tom="vinho">
    <div className="absolute inset-x-[64px] bottom-[112px] top-[96px] flex flex-col gap-[18px]">
      <div className="h-[4px] w-[64px] bg-[#f7ecdc]" />
      <Titulo style={{ fontSize: 66 }}>A franqueadora faz a parte dela por inteiro.</Titulo>
      <p className="em-sans text-[17.5px] leading-[1.5]">
        Todo mês, emite a nota fiscal dos royalties de cada unidade, com o valor certo e o CNPJ da unidade como tomador. Essa nota vai para a
        mesma base nacional da NFS-e em que estão as notas que a sua unidade emite.
      </p>
      <p className="em-sans text-[17.5px] leading-[1.5]">
        É justamente por estar tudo certo do lado da franqueadora que existe uma primeira pista sobre o faturamento de cada unidade. E ela é
        fácil de reconhecer: o royalty é 8% do faturamento bruto. Quem olha a nota de royalty sabe, numa divisão, quanto a unidade faturou.
      </p>
      <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-[10px] bg-[#1d1413] px-[18px] py-[16px] text-[#f7ecdc]">
        {[
          ['R$ 6.400', 'de nota de royalty'],
          ['R$ 80.000', 'de faturamento revelado'],
          ['R$ 28.000', 'de diferença, se as suas NFS-e somam R$ 52.000.'],
        ].map(([v, t], i) => (
          <Fragment key={v}>
            {i > 0 && <span className="em-display text-[34px] font-extrabold text-[#ffd9a8]">→</span>}
            <div>
              <div className={`em-display text-[40px] font-extrabold leading-none ${i === 2 ? 'text-[#ff8a9a]' : ''}`}>{v}</div>
              <div className="em-sans mt-[4px] text-[13px] leading-[1.3] opacity-85">{t}</div>
            </div>
          </Fragment>
        ))}
      </div>
      <p className="em-sans text-[17.5px] leading-[1.5]">
        Para reconhecer essa diferença, ninguém precisa de denúncia, de supercomputador nem de rastreamento de Pix. Basta pôr lado a lado duas
        notas oficiais: a que a franqueadora emitiu e as que a unidade emitiu. A primeira a unidade não controla e não pode mudar.
      </p>
      <p className="em-sans border-l-[3px] border-[#f7ecdc] pl-[16px] text-[18px] font-semibold leading-[1.5]">
        A rede fez tudo certo, e é por isso que a pista já está lá. Se o que a unidade informa à rede, inclusive o repasse do Wellhub, não
        aparece também nas notas dela, a diferença salta aos olhos na primeira comparação.
      </p>
    </div>
  </Pagina>
);

export const Numeros1 = ({ lado }: P) => (
  <Pagina lado={lado} numero={N.pagina + 1} tom="escuro">
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
  <Pagina lado={lado} numero={N.pagina + 2}>
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

// Podcast da edição (vídeo com o áudio, 18 min). Não toca sozinho: a pessoa aperta o play.
const PODCAST = '/videos/entre-molas/especial/podcast-nota-fiscal.mp4';

// Página só do podcast (vídeo com o áudio, 18 min). Não toca sozinho: a pessoa aperta o play.
export const NumerosPodcast = ({ lado }: P) => (
  <Pagina lado={lado} numero={N.pagina + 3} tom="escuro">
    <div className="absolute inset-x-[64px] bottom-[112px] top-[96px] flex flex-col items-center gap-[26px]">
      <div className="self-stretch">
        <Titulo style={{ fontSize: 58 }}>Edição especial: nota fiscal e reforma tributária</Titulo>
        <p className="em-sans mt-[10px] text-[17px] opacity-80">Conteúdo educativo.</p>
      </div>
      <div onPointerDown={segura} onPointerUp={segura} onClick={segura} className="overflow-hidden rounded-[12px] bg-black shadow-[0_24px_60px_-20px_rgba(0,0,0,0.8)]">
        <video src={PODCAST} poster={posterPodcast} controls preload="none" playsInline className="block h-[560px] w-[560px] object-cover" />
      </div>
    </div>
  </Pagina>
);

export const Numeros3 = ({ lado }: P) => (
  <Pagina lado={lado} numero={N.pagina + 4}>
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

// Wellhub: texto enviado pelo time em 18/11/2026, com o destaque pedido.
export const NumerosWellhub = ({ lado }: P) => (
  <Pagina lado={lado} numero={N.pagina + 5}>
    <div className="absolute inset-x-[64px] bottom-[112px] top-[96px] flex flex-col justify-center gap-[26px]">
      <div className="em-tom--vinho px-[34px] py-[34px]">
        <Rotulo className="!text-[#f7ecdc]">Wellhub</Rotulo>
        <h2 className="em-display mt-[10px] text-[64px] font-extrabold uppercase leading-[0.92]">
          Check-in do Wellhub também é faturamento. <span className="text-[#ffd9a8]">E também precisa de nota.</span>
        </h2>
      </div>
      <p className="em-serif text-[22px] leading-[1.45]">
        Esse dinheiro paga um serviço que a sua unidade prestou. Por isso ele segue exatamente a mesma regra das mensalidades.
      </p>
      <div className="border-t-[3px] border-[var(--em-vinho)] pt-[14px]">
        <Texto>
          <Destaque>É receita da unidade.</Destaque> O próprio Wellhub explica que é só intermediador: quem presta o serviço ao aluno é a unidade.
          Ele não emite nota fiscal para os parceiros, e o repasse chega bruto, com os impostos dentro. Recolher esses tributos é
          responsabilidade da unidade.
        </Texto>
      </div>
      <div className="border-t-[3px] border-[var(--em-vinho)] pt-[14px]">
        <Texto>
          <Destaque>Precisa de nota fiscal.</Destaque> Toda receita da unidade é documentada, qualquer que seja o canal.
        </Texto>
      </div>
    </div>
  </Pagina>
);

// ── 07 Padrão da rede ───────────────────────────────────────────────────────
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
  const total = PERGUNTAS.length;
  const msg = n === 0 ? MENSAGENS[0] : n * 2 <= total ? MENSAGENS[1] : n < total ? MENSAGENS[2] : MENSAGENS[3];
  return (
    <Pagina lado={lado} numero={PD.pagina + 2}>
      <div className="absolute inset-x-[64px] bottom-[112px] top-[96px] flex flex-col">
        <Rotulo>Checklist da unidade</Rotulo>
        <Titulo className="mt-[10px]" style={{ fontSize: 50 }}>Seis perguntas para responder com o seu contador</Titulo>
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
                <small className="text-[28px]">/{total}</small>
              </div>
            </div>
            <p className="em-sans max-w-[400px] text-right text-[15px] leading-[1.4]">{msg}</p>
          </div>
          <div className="mt-[10px] h-[8px] bg-white/15">
            <div className="h-full bg-[#e0566b] transition-all duration-500" style={{ width: `${(n / total) * 100}%` }} />
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
  'LC 214/2025; LC 227/2026',
  'Resolução CGSN 191/2026, CRC-MS',
  'Cronograma do Ato Conjunto RFB/CGIBS 4/2026, CGIBS',
  'STF, Tema 863 (RE 736.090) e Tema 300 (RE 603.136)',
  'Resolução CGSN 140/2018 e Manual de Exclusão do Simples, Receita Federal',
  'Decreto 53.151/2012 e Manual DOC-DIMP, Prefeitura de São Paulo',
  'SC SF/DEJUG 10/2025 e Orientações sobre RPS, Prefeitura de São Paulo',
  'Perguntas e respostas da e-Financeira, Receita Federal',
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

// ── Destaque: Pure GPT ──────────────────────────────────────────────────────
// O chat de pedir arte do Pure Design. A conversa do celular é um exemplo animado
// (MotionPureGpt); as artes são miniaturas reais dos modelos do Pure Design.

export const PureGpt1 = ({ lado }: P) => (
  <Pagina lado={lado} numero={PURE_GPT.pagina} tom="escuro">
    <div className="absolute inset-x-[64px] bottom-[112px] top-[96px] grid grid-cols-[1fr_292px] items-center gap-[34px]">
      <div className="flex flex-col gap-[20px]">
        <div className="flex items-center gap-[12px]">
          <span className="em-sans rounded-full bg-[#e0566b] px-[12px] py-[4px] text-[12px] font-bold uppercase tracking-[0.18em] text-white">Novidade</span>
          <Rotulo>{PURE_GPT.secao}</Rotulo>
        </div>
        <Titulo style={{ fontSize: 92 }}>
          Você pediu.
          <br />
          <span className="text-[#e0566b]">A gente fez.</span>
        </Titulo>
        <p className="em-serif text-[19px] leading-[1.5]">
          Agora as suas artes são criadas com inteligência artificial, direto no Pure Design. Um chat inteligente entende o que a sua unidade
          precisa e entrega a arte pronta, no padrão da marca, enquanto você conversa.
        </p>
        <p className="em-sans border-l-[3px] border-[#e0566b] pl-[14px] text-[15px] font-semibold leading-[1.45] opacity-90">
          Sem procurar modelo, sem trocar texto campo por campo. Você escreve, ele entrega.
        </p>
      </div>
      <MotionPureGpt className="h-[560px] w-[292px]" />
    </div>
  </Pagina>
);

const CAPACIDADES = [
  { Icone: Wand2, t: 'Escolhe o modelo certo', d: 'Entre todos os modelos da marca, acha o que combina com o pedido.' },
  { Icone: Type, t: 'Escreve os textos', d: 'Preenche título, datas e chamadas no tom da Pure.' },
  { Icone: ImagePlus, t: 'Usa a sua foto', d: 'Anexe a foto da unidade ou da equipe e ela entra na arte.' },
  { Icone: MessageCircleQuestion, t: 'Pergunta quando falta algo', d: 'Se faltar uma informação, ele pergunta antes de fazer.' },
  { Icone: SlidersHorizontal, t: 'Ajusta na conversa', d: '“Muda esse texto”, “coloca em negrito”, “logo embaixo”.' },
  { Icone: Tag, t: 'Entrega o que já está pronto', d: 'Pediu a tag do mês? Ela chega direto no chat.' },
];

export const PureGpt2 = ({ lado }: P) => (
  <Pagina lado={lado} numero={PURE_GPT.pagina + 1}>
    <div className="absolute inset-x-[64px] bottom-[112px] top-[96px] flex flex-col gap-[30px]">
      <Titulo className="border-b-2 border-[var(--em-tinta)] pb-[12px]" style={{ fontSize: 60 }}>
        Uma frase no lugar de dez cliques
      </Titulo>
      <div className="grid grid-cols-2 gap-[18px]">
        {[
          { r: 'Antes', cor: 'bg-[var(--em-papel-2)]', itens: ['Procurar o modelo certo entre dezenas', 'Trocar o texto campo por campo', 'Ajustar tudo à mão'] },
          { r: 'Agora', cor: 'em-tom--vinho', itens: ['Escrever o que você precisa', 'Receber a arte pronta', 'Pedir os ajustes na conversa'] },
        ].map((c) => (
          <div key={c.r} className={`${c.cor} px-[22px] py-[20px]`}>
            <div className="em-display text-[34px] font-extrabold uppercase leading-none">{c.r}</div>
            <ul className="em-sans mt-[12px] space-y-[8px] text-[16.5px] leading-[1.35]">
              {c.itens.map((i) => (
                <li key={i} className="flex gap-[8px]">
                  <span className="font-bold">{c.r === 'Antes' ? '·' : '✓'}</span>
                  {i}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-[28px] gap-y-[30px]">
        {CAPACIDADES.map(({ Icone, t, d }) => (
          <div key={t} className="flex gap-[12px]">
            <span className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full bg-[var(--em-vinho)] text-[#f7ecdc]">
              <Icone className="h-[24px] w-[24px]" />
            </span>
            <span>
              <span className="em-display block text-[26px] font-extrabold uppercase leading-[1]">{t}</span>
              <span className="em-sans mt-[5px] block text-[15.5px] leading-[1.42]">{d}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  </Pagina>
);

const EXEMPLOS = [
  { pedido: 'Quero divulgar a aula experimental', arte: '/images/pure-design/aula-experimental-texto.jpg' },
  { pedido: 'Lista dos aniversariantes de novembro', arte: '/images/pure-design/aniversariantes-mes.jpg' },
  { pedido: 'Mensagem de fim de ano para os alunos', arte: '/images/pure-design/natal-boas-festas.jpg' },
  { pedido: 'Aviso de mudança de horário na quinta', arte: '/images/pure-design/mudanca-horario.jpg' },
];

export const PureGpt3 = ({ lado }: P) => (
  <Pagina lado={lado} numero={PURE_GPT.pagina + 2} tom="escuro">
    <div className="absolute inset-x-[64px] bottom-[112px] top-[96px] flex flex-col gap-[22px]">
      <div>
        <Rotulo>Peça do seu jeito</Rotulo>
        <Titulo className="mt-[8px]" style={{ fontSize: 54 }}>
          Você escreve. <span className="text-[#e0566b]">A arte chega.</span>
        </Titulo>
      </div>
      <div className="grid flex-1 grid-cols-2 gap-x-[24px] gap-y-[20px]">
        {EXEMPLOS.map((e) => (
          <div key={e.pedido} className="flex flex-col gap-[10px]">
            <span className="em-sans self-start rounded-[14px] rounded-bl-[3px] bg-[#a9293b] px-[12px] py-[7px] text-[13.5px] font-semibold leading-[1.3] text-[#f7ecdc]">
              {e.pedido}
            </span>
            <img src={e.arte} alt="" draggable={false} className="h-[236px] w-[189px] select-none rounded-[6px] object-cover shadow-[0_16px_34px_-14px_rgba(0,0,0,0.7)]" />
          </div>
        ))}
      </div>
      <p className="em-sans text-[13px] opacity-70">Artes feitas com os modelos do Pure Design.</p>
    </div>
  </Pagina>
);

const PASSOS_GPT: [string, string, string][] = [
  ['01', 'Abra o Pure Design', 'No menu do Hub, entre em Pure Design. O chat está logo no topo, em Peça sua arte.'],
  ['02', 'Escreva o pedido', 'Aviso de feriado, vaga de instrutor, aula experimental, aniversário da equipe. Com as suas palavras, sem formulário.'],
  ['03', 'Anexe a foto, se quiser', 'Quer uma foto da unidade ou da equipe na arte? Mande no chat.'],
  ['04', 'Ajuste conversando', 'Mudou de ideia sobre um texto ou o lugar do logo? É só pedir.'],
  ['05', 'Baixe e publique', 'Baixe o PNG na hora ou abra no editor para mexer à mão.'],
];

export const PureGpt4 = ({ lado }: P) => (
  <Pagina lado={lado} numero={PURE_GPT.pagina + 3}>
    <div className="absolute inset-x-[64px] bottom-[112px] top-[96px] flex flex-col gap-[18px]">
      <Titulo className="border-b-2 border-[var(--em-tinta)] pb-[12px]" style={{ fontSize: 54 }}>
        Comece agora
      </Titulo>
      <div>
        {PASSOS_GPT.map(([n, t, d]) => (
          <div key={n} className="flex gap-[22px] border-b border-[var(--em-tinta)]/15 py-[16px]">
            <div className="em-display w-[58px] shrink-0 text-[50px] font-extrabold leading-[0.95] text-[var(--em-vinho)]">{n}</div>
            <div>
              <div className="em-display text-[31px] font-extrabold uppercase leading-[1]">{t}</div>
              <p className="em-sans mt-[6px] text-[17px] leading-[1.45]">{d}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="em-tom--vinho mt-auto px-[26px] py-[20px]">
        <div className="em-display text-[30px] font-extrabold uppercase leading-[1]">Precisa da tag do mês?</div>
        <p className="em-sans mt-[6px] text-[15.5px] leading-[1.42]">Ele também entrega as artes prontas da rede, como as tags, direto no chat.</p>
      </div>
    </div>
  </Pagina>
);

// ── Gente da Pure · Reconhecimento ─────────────────────────────────────────
// "O cuidado que aparece". Texto do time exatamente como veio (19/11/2026); a palavra
// de acento do título vai em itálico, como no brandbook.

export const Reconhecimento1 = ({ lado }: P) => (
  <Pagina lado={lado} numero={RECONHECIMENTO.pagina} tom="vinho">
    <div className="absolute inset-x-[64px] bottom-[112px] top-[96px] flex flex-col gap-[24px]">
      <div className="em-sans text-[14px] font-bold uppercase tracking-[0.24em]">{RECONHECIMENTO.sobretitulo}</div>
      <h2 className="em-display text-[118px] font-extrabold uppercase leading-[0.86] tracking-[-0.01em]">
        O cuidado que <em className="font-extrabold italic text-[#ffd9a8]">aparece</em>
      </h2>
      <p className="em-serif text-[22px] leading-[1.45]">
        A nota da Pure no Reclame Aqui chegou a 7,3, já na faixa “bom”. O número é novo. O cuidado que ele mostra não é: é o de sempre das
        equipes de Operações e Consultoria.
      </p>
      <div aria-hidden="true" className="flex items-center gap-[26px] bg-[#1d1413] px-[28px] py-[22px] text-[#f7ecdc]">
        <div className="em-display text-[124px] font-extrabold leading-[0.85] text-[#ffd9a8]">7,3</div>
        <div className="flex flex-1 items-center gap-[12px]">
          <div className="text-center">
            <div className="em-sans text-[11px] font-bold uppercase tracking-[0.18em] opacity-60">Antes</div>
            <div className="em-display mt-[4px] text-[34px] font-extrabold uppercase leading-none opacity-50 line-through decoration-[#e0566b] decoration-[3px]">Regular</div>
          </div>
          <span className="em-display text-[40px] font-extrabold text-[#e0566b]">→</span>
          <div className="text-center">
            <div className="em-sans text-[11px] font-bold uppercase tracking-[0.18em] opacity-60">Hoje</div>
            <div className="em-display mt-[4px] text-[44px] font-extrabold uppercase leading-none text-[#ffd9a8]">Bom</div>
          </div>
        </div>
        <div className="em-sans text-right text-[12px] font-bold uppercase leading-[1.4] tracking-[0.16em] opacity-70">
          Reclame
          <br />
          Aqui
        </div>
      </div>
      <p className="em-sans text-[18px] leading-[1.6]">
        A nota da Pure Pilates no Reclame Aqui está em 7,3. Antes, quem pesquisava a marca encontrava a palavra “regular”. Hoje encontra “bom”.
        E, se o número mudou, é porque ele finalmente está mostrando o que já existia aqui dentro: o cuidado das equipes de Operações e
        Consultoria com cada aluno que precisou de uma resposta.
      </p>
    </div>
  </Pagina>
);

export const Reconhecimento2 = ({ lado }: P) => (
  <Pagina lado={lado} numero={RECONHECIMENTO.pagina + 1}>
    <div className="absolute inset-x-[64px] bottom-[112px] top-[96px] flex flex-col gap-[22px]">
      <blockquote className="em-display border-l-[5px] border-[var(--em-vinho)] pl-[22px] text-[40px] font-bold uppercase leading-[0.98] text-[var(--em-vinho)]">
        “A nota não mediu um processo. Mediu o cuidado de quem atendeu.”
      </blockquote>
      <div className="em-sans columns-2 gap-[30px] text-[15.5px] leading-[1.55] [&>p]:mb-[12px] [&>p]:break-inside-avoid-column">
        <p>
          Esse cuidado tem cara de coisa pequena. É a ligação feita no mesmo dia. É o nome da pessoa lembrado na segunda conversa. É o retorno
          dado à unidade com calma, mesmo numa segunda-feira cheia. É tratar uma reclamação pelo que ela é: alguém que escolheu a Pure e quer
          poder continuar escolhendo.
        </p>
        <p>
          Quem faz esse trabalho sabe que ele quase nunca aparece. Não rende palco, foto nem áudio no grupo. Dessa vez apareceu, em um número
          público que qualquer pessoa pode consultar. Essa é a parte bonita da história: a nota virou o espelho do jeito como vocês cuidam das
          nossas entregas.
        </p>
        <p>
          E cuidado, aqui, tem efeito de negócio. A reputação no Reclame Aqui é uma das primeiras coisas que aparecem para quem pesquisa a Pure
          antes de marcar a aula experimental. Uma marca “bom” conversa melhor com essa pessoa, e isso vale para a rede inteira ao mesmo tempo,
          sem um real de mídia. Operações e Consultoria entregaram aos estúdios um argumento que anúncio nenhum compra.
        </p>
        <p>
          É isso que a gente mais quer preservar: o padrão de atendimento que fez esse número acontecer já é o padrão da casa. Ele é a nossa
          referência de como uma entrega da Pure chega ao cliente, em qualquer unidade de negócio. E essa referência veio de vocês.
        </p>
      </div>
      <div className="mt-auto flex items-center gap-[20px] border-t-2 border-[var(--em-tinta)] pt-[16px]">
        {/* janela: o recorte do Douglas termina na borda do quadro */}
        <span className="relative block h-[220px] w-[160px] shrink-0 overflow-hidden rounded-[16px] bg-[var(--em-vinho)]">
          <img
            src={douglas}
            alt="Douglas Paiva"
            draggable={false}
            className="absolute left-1/2 top-[-30px] h-[300px] w-auto max-w-none -translate-x-1/2 select-none"
          />
        </span>
        <div className="pb-[6px]">
          <p className="em-serif text-[26px] italic leading-[1.3] text-[var(--em-vinho)]">Obrigada por cuidarem assim. De verdade.</p>
          <p className="em-sans mt-[6px] text-[14px] font-bold uppercase tracking-[0.16em]">Douglas Paiva · CEO Pure Pilates</p>
        </div>
      </div>
    </div>
  </Pagina>
);
