// Fluxo de mídia das unidades: com aporte (mídia própria) e sem aporte (verba
// de contribuição mensal da rede). Reconstruído em HTML nativo a partir dos
// slides do marketing (Black Friday 2026), com as cores de cada slide: mostarda
// no "com aporte", vinho no "sem aporte". O fluxograma vira coluna no celular.
// Mora dentro do manual do Comece (ManualComece.tsx), parte "Fluxo de mídia".

import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ArrowDown, ArrowRight, Check, Copy, Star } from 'lucide-react';

const SERIFA = { fontFamily: "Georgia, 'Times New Roman', serif" };
const VERMELHO = '#C1002F';

interface Caixa {
  rotulo: string;
  titulo: string;
  texto?: string;
}

interface Modelo {
  slug: string;
  titulo: string;
  subtitulo: string;
  palavra: 'com' | 'sem';
  eyebrow: string;
  resumo: ReactNode;
  evento: string;
  anuncio: Caixa;
  destino: Caixa;
  foco: Caixa;
  alternativa: Caixa;
  resultado: string;
  url: string;
  /** O que vai para a área de transferência: o padrão, ou a URL pronta. */
  copiar: string;
  nota: string;
  /** Paleta do slide. */
  fundo: string;
  tinta: string;
  suave: string;
  enfase: string;
  caixaClara: string;
  caixaDestino: string;
  caixaFoco: string;
  caixaAlternativa: string;
  linha: string;
}

const MODELOS: Modelo[] = [
  {
    slug: 'com-aporte',
    titulo: 'Unidades com mídia aporte',
    subtitulo: 'Fluxo de mídia e configurações',
    palavra: 'com',
    eyebrow: 'Fluxo de mídia · Unidades com aporte',
    resumo: (
      <>
        A campanha da unidade otimiza para o agendamento de <strong>aula experimental</strong> e leva direto à página da
        própria unidade, sem passar pela busca.
      </>
    ),
    evento: 'Aula experimental',
    anuncio: { rotulo: 'Anúncio', titulo: 'Mídia da unidade', texto: 'Verba local, no raio da unidade, com UTM própria.' },
    destino: {
      rotulo: 'Página de destino',
      titulo: '/comece-aqui/ endereço da unidade',
      texto: 'Página da unidade: sem busca, sem menu e sem trocar de unidade.',
    },
    foco: { rotulo: 'Foco da campanha', titulo: 'Aula experimental', texto: 'Agendamento na unidade.' },
    alternativa: { rotulo: 'Também disponível', titulo: 'Pure Pass', texto: 'Adesão online, 50% off no 1º mês.' },
    resultado: 'Crédito na unidade',
    url: 'purepilates.com.br/comece-aqui/[uf]/[cidade]/[unidade]',
    copiar: 'https://www.purepilates.com.br/comece-aqui/[uf]/[cidade]/[unidade]',
    nota: 'Exemplo: https://www.purepilates.com.br/comece-aqui/sp/sao-paulo/casa-verde',
    fundo: 'bg-[#E0A458]',
    tinta: 'text-[#111]',
    suave: 'text-[#111]/80',
    enfase: 'text-[#C1002F]',
    caixaClara: 'bg-[#F4ECDD] text-[#111]',
    caixaDestino: 'bg-[#111] text-white',
    caixaFoco: 'bg-[#C1002F] text-white',
    caixaAlternativa: 'border-2 border-dashed border-[#111] bg-[#FBF6EC] text-[#111]',
    linha: 'text-[#111]',
  },
  {
    slug: 'sem-aporte',
    titulo: 'Unidades com verba de contribuição mensal',
    subtitulo: 'Modelo de tráfego e mensuração',
    palavra: 'sem',
    eyebrow: 'Fluxo de mídia · Unidades abertas sem aporte',
    resumo: (
      <>
        A verba de contribuição da rede otimiza para a <strong>venda de Pure Pass</strong> e leva para a /comece, onde o
        lead encontra a unidade mais próxima.
      </>
    ),
    evento: 'Venda de Pure Pass',
    anuncio: { rotulo: 'Anúncio', titulo: 'Mídia da rede', texto: 'Verba de contribuição.' },
    destino: {
      rotulo: 'Página de destino',
      titulo: 'purepilates.com.br/comece',
      texto: 'Busca por CEP ou localização e escolha da unidade.',
    },
    foco: { rotulo: 'Foco da campanha', titulo: 'Pure Pass', texto: '50% off no 1º mês, adesão online.' },
    alternativa: { rotulo: 'Alternativa', titulo: 'Experimental ou avulsa', texto: 'R$ 0,00 ou R$ 39,90, conforme a unidade.' },
    resultado: 'Adesão online',
    url: 'purepilates.com.br/comece',
    copiar: 'https://www.purepilates.com.br/comece',
    nota: 'Uma única página de destino para toda a mídia da rede; a unidade é escolhida pelo lead.',
    fundo: 'bg-[#2E0A12]',
    tinta: 'text-[#F4ECDD]',
    suave: 'text-[#F4ECDD]/85',
    enfase: 'text-[#E0A458]',
    caixaClara: 'bg-[#F4ECDD] text-[#111]',
    caixaDestino: 'bg-[#C1002F] text-white',
    caixaFoco: 'bg-[#E0A458] text-[#111]',
    caixaAlternativa: 'border-2 border-dashed border-[#F4ECDD]/80 bg-[#4A2A30] text-[#F4ECDD]',
    linha: 'text-[#F4ECDD]',
  },
];

const BotaoCopiar = ({ texto }: { texto: string }) => {
  const [copiado, setCopiado] = useState(false);
  return (
    <button
      type="button"
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/25 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/10"
      onClick={() => {
        navigator.clipboard?.writeText(texto).then(() => {
          setCopiado(true);
          setTimeout(() => setCopiado(false), 1800);
        });
      }}
    >
      {copiado ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copiado ? 'Copiado' : 'Copiar URL'}
    </button>
  );
};

/** Uma caixa do fluxograma, com a sombra sólida dos slides. */
const Bloco = ({ caixa, classe, rotuloCor, destaque }: { caixa: Caixa; classe: string; rotuloCor: string; destaque?: boolean }) => (
  <div className={cn('rounded-xl p-4 shadow-[5px_5px_0_rgba(0,0,0,0.85)]', classe)}>
    <p className={cn('font-mono text-[10px] font-bold uppercase tracking-[0.2em]', rotuloCor)}>{caixa.rotulo}</p>
    <p className={cn('mt-1 font-black leading-tight tracking-tight', destaque ? 'text-xl' : 'text-lg')}>{caixa.titulo}</p>
    {caixa.texto && <p className="mt-2 text-[13px] leading-snug opacity-90">{caixa.texto}</p>}
  </div>
);

/** Seta entre caixas: para baixo no celular, para o lado a partir do md. */
const Seta = ({ cor }: { cor: string }) => (
  <div className={cn('flex items-center justify-center', cor)}>
    <ArrowDown className="h-5 w-5 md:hidden" />
    <ArrowRight className="hidden h-5 w-5 md:block" />
  </div>
);

/** URL que só quebra nas barras, nunca no meio de uma palavra. */
const Url = ({ texto }: { texto: string }) => (
  <>
    {texto.split('/').map((parte, i) => (
      <span key={i}>
        {i > 0 && '/'}
        {i > 0 && <wbr />}
        {parte}
      </span>
    ))}
  </>
);

/** A capa do material: "Fluxo de mídia" sobre o vermelho, com a palavra grande ao fundo. */
export const CapaFluxoMidia = () => (
  <div className="relative overflow-hidden rounded-2xl px-6 pb-16 pt-10 sm:px-10" style={{ backgroundColor: VERMELHO }}>
    <span
      className="pointer-events-none absolute -bottom-10 -left-2 select-none text-[9rem] font-black leading-none tracking-tighter text-black/20 sm:text-[13rem]"
      aria-hidden
    >
      MÍDIA
    </span>
    <div className="relative">
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.35em] text-[#F4ECDD]">
        Pure Pilates · Black Friday 2026
      </p>
      <p className="mt-5 leading-[0.9]">
        <span className="block text-5xl font-black uppercase tracking-tighter text-[#F4ECDD] sm:text-6xl">Fluxo de</span>
        <span className="block text-5xl italic text-[#F2C27A] sm:text-6xl" style={SERIFA}>
          mídia
        </span>
      </p>
      <p className="mt-6 max-w-xl text-base text-[#F4ECDD]">
        Evento de otimização e página de destino para unidades com e sem aporte.
      </p>
    </div>
  </div>
);

/** O slide de um modelo: título, fluxograma e a regra de toda campanha. */
export const FluxoMidiaModelo = ({ slug }: { slug: 'com-aporte' | 'sem-aporte' }) => {
  const m = MODELOS.find((x) => x.slug === slug)!;
  const claro = m.palavra === 'com';

  return (
    <div className={cn('overflow-hidden rounded-2xl px-6 py-10 sm:px-10', m.fundo)}>
      <p className={cn('font-mono text-[11px] font-bold uppercase tracking-[0.35em]', claro ? 'text-[#111]' : 'text-[#E0A458]')}>
        {m.eyebrow}
      </p>
      <p className="mt-3 leading-none">
        <span className={cn('text-4xl font-black uppercase tracking-tighter sm:text-5xl', m.tinta)}>
          Unidades {m.palavra}{' '}
        </span>
        <span className={cn('text-4xl italic sm:text-5xl', m.enfase)} style={SERIFA}>
          aporte
        </span>
      </p>
      <p className={cn('mt-4 max-w-3xl text-base leading-relaxed', m.suave)}>{m.resumo}</p>

      {/* Fluxograma em duas etapas: o caminho até a decisão e, depois, o que o
          lead escolhe e o resultado. Cinco caixas numa linha só espremiam os
          títulos palavra por palavra; aqui cada caixa tem largura para respirar. */}
      <div className="mt-10">
        <p className={cn('mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.25em]', m.suave)}>
          1 · O caminho até a decisão
        </p>
        <div className="grid items-stretch gap-3 md:grid-cols-[1fr_auto_1.35fr_auto_0.9fr]">
          <Bloco caixa={m.anuncio} classe={m.caixaClara} rotuloCor="text-[#C1002F]" />
          <Seta cor={m.linha} />
          <Bloco caixa={m.destino} classe={m.caixaDestino} rotuloCor={claro ? 'text-[#E0A458]' : 'text-[#F2C27A]'} />
          <Seta cor={m.linha} />
          <Bloco caixa={{ rotulo: 'Decisão', titulo: 'O lead escolhe' }} classe={m.caixaClara} rotuloCor="text-[#C1002F]" />
        </div>

        <div className={cn('my-5 flex items-center gap-3', m.linha)}>
          <span className="h-px flex-1 bg-current opacity-30" />
          <ArrowDown className="h-5 w-5" />
          <span className="h-px flex-1 bg-current opacity-30" />
        </div>

        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className={cn('font-mono text-[10px] font-bold uppercase tracking-[0.25em]', m.suave)}>
            2 · O que o lead escolhe
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#111] px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#F2C27A]">
            <Star className="h-3 w-3 shrink-0 fill-current" />
            Evento de otimização: {m.evento}
          </span>
        </div>
        <div className="grid items-stretch gap-3 md:grid-cols-[1.2fr_1fr_auto_0.9fr]">
          <Bloco caixa={m.foco} classe={m.caixaFoco} rotuloCor={claro ? 'text-[#F2C27A]' : 'text-[#111]/70'} destaque />
          <div className={cn('rounded-xl p-4', m.caixaAlternativa)}>
            <p className={cn('font-mono text-[10px] font-bold uppercase tracking-[0.2em]', claro ? 'text-[#C1002F]' : 'text-[#E0A458]')}>
              {m.alternativa.rotulo}
            </p>
            <p className="mt-1 text-lg font-black leading-tight tracking-tight">{m.alternativa.titulo}</p>
            <p className="mt-2 text-[13px] leading-snug opacity-90">{m.alternativa.texto}</p>
          </div>
          <Seta cor={m.linha} />
          <Bloco caixa={{ rotulo: 'Resultado', titulo: m.resultado }} classe={m.caixaClara} rotuloCor="text-[#C1002F]" />
        </div>
      </div>

      {/* Regra de toda campanha */}
      <div className="mt-10 rounded-xl bg-[#0D0B0B] px-5 py-5 sm:px-7">
        <div className="flex items-start justify-between gap-4">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-[#E0A458]">
            Regra · toda campanha
          </p>
          <BotaoCopiar texto={m.copiar} />
        </div>
        <p className="mt-3 font-mono text-base font-bold text-white sm:text-lg">
          <Url texto={m.url} />
        </p>
        <p className="mt-1 text-sm text-white/75">
          {m.nota.startsWith('Exemplo: ') ? (
            <>
              Exemplo: <Url texto={m.nota.slice('Exemplo: '.length)} />
            </>
          ) : (
            m.nota
          )}
        </p>
      </div>
    </div>
  );
};
