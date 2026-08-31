import simbolo from '@/assets/logo-symbol.png';

/**
 * A faixa vermelha que abre as telas de relatório do Hub.
 *
 * É o único lugar ousado destas páginas, e de propósito: tudo abaixo dela é
 * branco, hairline e disciplinado. A faixa carrega a marca, diz onde a pessoa
 * está e — no relatório — mostra os números que são a tese da página, antes de
 * qualquer tabela.
 *
 * A identidade sai dos tokens que o Hub já tem (`--gradient-primary`,
 * `--shadow-pure`, Montserrat), e não de cores escolhidas aqui. Assim a tela
 * envelhece junto com o resto do Hub, e o vermelho é o mesmo do e-mail e do PDF.
 *
 * O símbolo aparece duas vezes: pequeno e nítido num quadrado branco (a marca),
 * e gigante sangrando pela direita a 6% (a textura). O segundo é decorativo —
 * `aria-hidden`, e some no mobile, onde só atrapalharia o texto.
 */
export function FaixaDaMarca({
  sobretitulo,
  titulo,
  descricao,
  acoes,
  children,
}: {
  sobretitulo: string;
  titulo: string;
  descricao: string;
  acoes?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header
      className="relative overflow-hidden rounded-2xl p-6 text-white sm:p-8"
      style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-pure)' }}
    >
      <img
        src={simbolo}
        alt=""
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-16 hidden h-[22rem] w-auto opacity-[0.06] lg:block"
        style={{ filter: 'brightness(0) invert(1)' }}
      />

      <div className="relative flex flex-col gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
              <img src={simbolo} alt="Pure Pilates" className="h-7 w-auto" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                {sobretitulo}
              </p>
              <h1 className="mt-1 font-heading text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
                {titulo}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/80">{descricao}</p>
            </div>
          </div>

          {acoes ? <div className="flex shrink-0 flex-wrap gap-2">{acoes}</div> : null}
        </div>

        {children}
      </div>
    </header>
  );
}

/**
 * Um número da faixa. Grande, tabular e com o rótulo embaixo — a ordem em que
 * se lê um número que já se sabe estar procurando.
 */
export function NumeroDaFaixa({
  valor,
  rotulo,
  nota,
}: {
  valor: string;
  rotulo: string;
  nota?: string;
}) {
  return (
    <div>
      <p className="font-heading text-2xl font-bold tabular-nums tracking-tight sm:text-[1.75rem]">
        {valor}
      </p>
      <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70">
        {rotulo}
      </p>
      {nota ? <p className="mt-1 text-xs leading-snug text-white/60">{nota}</p> : null}
    </div>
  );
}

/** A régua que separa o cabeçalho dos números dentro da faixa. */
export function DivisorDaFaixa() {
  return <div className="h-px w-full bg-white/20" />;
}
