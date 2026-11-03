import logoVinho from '../assets/logo-entre-molas-vinho.png';
import caroline from './fotos/caroline-recorte.png';
import { AUTORA_ARTIGO, CARGO_ARTIGO, MATERIAS, SUBTITULO_ARTIGO } from './materias';
import { useNavegacao } from '../diagramacao';

// Capa da Edição 2 — a mesma da Edição 1: logo enorme no topo, a pessoa recortada
// passando à frente dele, poucas chamadas. Matéria de capa: o artigo da Caroline.

const pag = (n: number) => `P. ${String(n).padStart(2, '0')}`;

const Capa = () => {
  const { irParaPagina } = useNavegacao();
  const ir = (n: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    irParaPagina(n);
  };

  return (
    <div className="em-page em-page--solta em-capa">
      <div className="em-seda" />
      <img
        src={logoVinho}
        alt="Entre Molas — Você por dentro de tudo."
        draggable={false}
        className="em-sobe absolute left-1/2 top-[34px] w-[760px] max-w-none select-none"
        style={{
          animationDelay: '0.15s',
          translate: '-50% 0',
          // corta a linha "Você por dentro de tudo.", que vai para baixo do logo
          clipPath: 'inset(0 0 24% 0)',
        }}
      />
      <div
        className="em-sans em-sobe absolute left-[46px] top-[212px] text-[21px] font-normal tracking-[0.04em] text-[var(--em-vinho)]"
        style={{ animationDelay: '0.3s' }}
      >
        Você por dentro de tudo.
      </div>
      {/* Caroline passando à frente do logo */}
      <img
        src={caroline}
        alt="Caroline Lo Duca Serroni"
        draggable={false}
        className="absolute left-[222px] top-[118px] w-[530px] max-w-none select-none"
        // sombra leve: assenta a foto no papel, sem cara de recorte colado
        style={{ filter: 'drop-shadow(0 14px 34px rgba(60, 24, 24, 0.32))' }}
      />

      {/* chamadas na lateral esquerda, sobre o fundo claro */}
      <div className="em-sobe absolute left-[44px] top-[290px] w-[178px] space-y-[22px]" style={{ animationDelay: '0.5s' }}>
        {[MATERIAS.blackFriday, MATERIAS.play, MATERIAS.reputacao].map((m, i) => (
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

      {/* chamadas à direita da Caroline */}
      <div className="em-sobe absolute right-[40px] top-[250px] w-[130px] space-y-[20px] text-right" style={{ animationDelay: '0.6s' }}>
        {[MATERIAS.norte, MATERIAS.move].map((m) => (
          <button key={m.pagina} type="button" onClick={ir(m.pagina)} className="block w-full text-right">
            <div className="ml-auto h-[3px] w-[30px] bg-[var(--em-vinho)]" />
            <div className="em-sans mt-[8px] text-[13px] font-bold tracking-[0.14em] text-[var(--em-vinho)]">{pag(m.pagina)}</div>
            <div className="em-display mt-[4px] text-[26px] font-extrabold uppercase leading-[0.92] text-[var(--em-vinho)]">{m.titulo}</div>
          </button>
        ))}
      </div>

      {/* manchete sobre a camisa */}
      <div className="absolute inset-x-0 bottom-0 h-[420px] bg-gradient-to-t from-[#140c0b] via-[#140c0b]/85 to-transparent" />
      <button
        type="button"
        onClick={ir(MATERIAS.artigo.pagina)}
        className="em-sobe absolute bottom-[40px] left-[44px] right-[44px] text-left"
        style={{ animationDelay: '0.7s' }}
      >
        <div className="em-sans mb-[12px] inline-block bg-[var(--em-vinho)] px-[10px] py-[5px] text-[14px] font-bold uppercase tracking-[0.24em] text-[#f7ecdc]">
          {MATERIAS.artigo.secao}
        </div>
        <div className="em-display mt-[4px] text-[84px] font-extrabold uppercase leading-[0.86] text-[#f7ecdc]">
          {MATERIAS.artigo.titulo}
        </div>
        <p className="em-serif mt-[12px] max-w-[600px] text-[20px] leading-[1.3] text-[#f7ecdc]/90">{SUBTITULO_ARTIGO}</p>
        <div className="mt-[14px] flex items-center gap-[14px]">
          <span className="h-[3px] w-[36px] shrink-0 bg-[#e0566b]" />
          <span className="em-sans text-[14px] font-bold uppercase leading-[1.4] tracking-[0.2em] text-[#f7ecdc]/90">
            {AUTORA_ARTIGO}
            <span className="block text-[12px] tracking-[0.16em]">{CARGO_ARTIGO}</span>
          </span>
          <span className="em-sans text-[14px] font-bold tracking-[0.12em] text-[#e0566b]">{pag(MATERIAS.artigo.pagina)}</span>
        </div>
      </button>
      <div className="em-grao" />
      <div className="em-verniz" />
    </div>
  );
};

export default Capa;
