import logoVinho from '../assets/logo-entre-molas-vinho.png';
import douglas from './fotos/douglas-recorte.png';
import socios from './fotos/socios-recorte.png';
import { ASSINATURA_CARTA, MATERIAS, SUBTITULO_CARTA } from './materias';
import { useNavegacao } from '../diagramacao';

// Capa da Edição 1 — limpa, no espírito das capas de banca de estilo de vida
// (referência: Boa Forma): logo enorme no topo, a pessoa recortada passando à
// frente dele, poucas chamadas. Matéria de capa: a carta do Douglas.
// Todo texto sai do Canva (ou da equipe), sem mudança — na capa, a manchete usa
// "17 anos, 500 unidades" em números, a pedido da equipe (30/09/2026).

export type VarianteCapa = 'douglas' | 'socios';

const pag = (n: number) => `P. ${String(n).padStart(2, '0')}`;

const Capa = ({ variante = 'douglas' }: { variante?: VarianteCapa }) => {
  const { irParaPagina } = useNavegacao();
  const ir = (n: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    irParaPagina(n);
  };

  const logo = (semAssinatura = false) => (
    <img
      src={logoVinho}
      alt="Entre Molas — Você por dentro de tudo."
      draggable={false}
      className="em-sobe absolute left-1/2 top-[34px] w-[760px] max-w-none select-none"
      style={{
        animationDelay: '0.15s',
        translate: '-50% 0',
        // corta a linha "Você por dentro de tudo." quando ela vai para outro lugar
        clipPath: semAssinatura ? 'inset(0 0 24% 0)' : undefined,
      }}
    />
  );

  const assinatura = (claro: boolean) => (
    <div className="mt-[14px] flex items-center gap-[14px]">
      <span className={`h-[3px] w-[36px] ${claro ? 'bg-[#e0566b]' : 'bg-[var(--em-vinho)]'}`} />
      <span className={`em-sans text-[14px] font-bold uppercase tracking-[0.2em] ${claro ? 'text-[#f7ecdc]/90' : 'text-[var(--em-tinta)]/80'}`}>
        {ASSINATURA_CARTA}
      </span>
      <span className={`em-sans text-[14px] font-bold tracking-[0.12em] ${claro ? 'text-[#e0566b]' : 'text-[var(--em-vinho)]'}`}>
        {pag(MATERIAS.carta.pagina)}
      </span>
    </div>
  );

  if (variante === 'socios') {
    return (
      <div className="em-page em-page--solta em-capa">
        <div className="em-seda" />
        {logo()}
        <button
          type="button"
          onClick={ir(MATERIAS.carta.pagina)}
          className="em-sobe absolute left-[44px] right-[44px] top-[236px] text-left"
          style={{ animationDelay: '0.4s' }}
        >
          <div className="em-sans mb-[12px] inline-block bg-[var(--em-vinho)] px-[10px] py-[5px] text-[14px] font-bold uppercase tracking-[0.24em] text-[#f7ecdc]">
            {MATERIAS.carta.secao}
          </div>
          <div className="em-display text-[30px] font-semibold uppercase leading-none tracking-[0.03em] text-[var(--em-tinta)]">
            17 anos, 500 unidades
          </div>
          <div className="em-display mt-[4px] text-[80px] font-extrabold uppercase leading-[0.86] text-[var(--em-vinho)]">
            e uma pergunta que não mudou
          </div>
        </button>
        <img
          src={socios}
          alt="Os sócios da Pure Pilates"
          draggable={false}
          className="absolute bottom-[-10px] left-[-50px] w-[920px] max-w-none select-none"
        />
        <div className="absolute inset-x-0 bottom-0 h-[250px] bg-gradient-to-t from-[#140c0b] via-[#140c0b]/85 to-transparent" />
        <div className="absolute bottom-[40px] left-[44px] right-[44px]">
          <p className="em-serif max-w-[560px] text-[21px] leading-[1.3] text-[#f7ecdc]/95">{SUBTITULO_CARTA}</p>
          {assinatura(true)}
        </div>
        <div className="em-grao" />
        <div className="em-verniz" />
      </div>
    );
  }

  return (
    <div className="em-page em-page--solta em-capa">
      <div className="em-seda" />
      {logo(true)}
      <div
        className="em-sans em-sobe absolute left-[46px] top-[212px] text-[21px] font-normal tracking-[0.04em] text-[var(--em-vinho)]"
        style={{ animationDelay: '0.3s' }}
      >
        Você por dentro de tudo.
      </div>
      {/* Douglas passando à frente do logo */}
      <img
        src={douglas}
        alt="Douglas Paiva"
        draggable={false}
        className="absolute left-[236px] top-[-70px] w-[640px] max-w-none select-none"
      />

      {/* chamadas na lateral esquerda, sobre o fundo claro */}
      <div className="em-sobe absolute left-[44px] top-[290px] w-[178px] space-y-[22px]" style={{ animationDelay: '0.5s' }}>
        {[MATERIAS.segundaMaior, MATERIAS.pilar].map((m, i) => (
          <button key={m.pagina} type="button" onClick={ir(m.pagina)} className="block text-left">
            <div className="em-sans text-[13px] font-bold tracking-[0.14em] text-[var(--em-vinho)]">{pag(m.pagina)}</div>
            <div
              className={`em-display mt-[4px] font-bold uppercase leading-[0.95] text-[var(--em-tinta)] ${i === 0 ? 'text-[34px] text-[var(--em-vinho)]' : 'text-[22px]'}`}
            >
              {m.titulo}
            </div>
          </button>
        ))}
      </div>

      {/* chamada à direita do Douglas. A matéria ainda não está no Canva: quando
          entrar na revista, ganha página (P. xx) e passa a levar até ela. */}
      <div
        className="em-sobe absolute right-[40px] top-[330px] w-[130px] text-right"
        style={{ animationDelay: '0.6s' }}
      >
        <div className="ml-auto h-[3px] w-[30px] bg-[var(--em-vinho)]" />
        <div className="em-display mt-[10px] text-[30px] font-extrabold uppercase leading-[0.92] text-[var(--em-vinho)]">
          Padrão Pure Pilates
        </div>
      </div>

      {/* manchete sobre a camisa preta */}
      <div className="absolute inset-x-0 bottom-0 h-[420px] bg-gradient-to-t from-[#140c0b] via-[#140c0b]/85 to-transparent" />
      <button
        type="button"
        onClick={ir(MATERIAS.carta.pagina)}
        className="em-sobe absolute bottom-[40px] left-[44px] right-[44px] text-left"
        style={{ animationDelay: '0.7s' }}
      >
        <div className="em-sans mb-[12px] inline-block bg-[var(--em-vinho)] px-[10px] py-[5px] text-[14px] font-bold uppercase tracking-[0.24em] text-[#f7ecdc]">
          {MATERIAS.carta.secao}
        </div>
        <div className="em-display text-[26px] font-semibold uppercase leading-none tracking-[0.03em] text-[#f7ecdc]">
          17 anos, 500 unidades
        </div>
        <div className="em-display mt-[4px] text-[84px] font-extrabold uppercase leading-[0.86] text-[#f7ecdc]">
          e uma pergunta que não mudou
        </div>
        <p className="em-serif mt-[12px] max-w-[600px] text-[20px] leading-[1.3] text-[#f7ecdc]/90">{SUBTITULO_CARTA}</p>
        {assinatura(true)}
      </button>
      <div className="em-grao" />
      <div className="em-verniz" />
    </div>
  );
};

export default Capa;
