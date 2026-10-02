import logoVinho from '../assets/logo-entre-molas-vinho.png';
import { Pagina, useNavegacao, type Lado } from '../diagramacao';
import { ORDEM_DO_SUMARIO } from './materias';

// Página 2 — sumário. Cada linha leva à página da matéria.

const Sumario = ({ lado }: { lado: Lado }) => {
  const { irParaPagina } = useNavegacao();
  return (
    <Pagina lado={lado} numero={2}>
      <div className="absolute left-[64px] right-[64px] top-[64px] flex items-end justify-between border-b-2 border-[var(--em-tinta)] pb-[18px]">
        <h2 className="em-display text-[112px] font-extrabold uppercase leading-[0.8] tracking-[-0.01em]">Sumário</h2>
        <img src={logoVinho} alt="Entre Molas" draggable={false} className="mb-[4px] w-[220px] select-none" />
      </div>

      <ol className="absolute left-[64px] right-[64px] top-[176px]">
        {ORDEM_DO_SUMARIO.map((m) => (
          <li key={m.pagina}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                irParaPagina(m.pagina);
              }}
              className="group flex w-full items-start gap-[24px] border-b border-[var(--em-tinta)]/15 py-[4px] text-left"
            >
              <span className="em-display w-[60px] shrink-0 text-[32px] font-extrabold leading-[1.15] text-[var(--em-vinho)] transition-transform duration-300 group-hover:translate-x-[6px]">
                {String(m.pagina).padStart(2, '0')}
              </span>
              {/* número e título alinhados pelo topo */}
              <span className="flex-1">
                <span className="em-sans mb-[3px] inline-block bg-[var(--em-vinho)] px-[8px] py-[3px] text-[11px] font-bold uppercase tracking-[0.2em] text-[#f7ecdc]">
                  {m.secao}
                </span>
                <span className="em-display block text-[21px] font-semibold uppercase leading-[1.02] tracking-[0.005em] transition-colors group-hover:text-[var(--em-vinho)]">
                  {m.titulo}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </Pagina>
  );
};

export default Sumario;
