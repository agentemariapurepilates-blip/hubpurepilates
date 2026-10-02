import { Miolo, Pagina, type Lado } from '../diagramacao';
import { MATERIAS } from './materias';

// "Somos a segunda maior do mundo": a tabela e os textos foram transcritos das artes do Canva.

const RANKING = [
  { marca: 'Club Pilates (Xponential)', pais: 'EUA', unidades: '1.414', fonte: 'HFA 2026 (dados 2025)' },
  { marca: 'Pure Pilates', pais: 'Brasil', unidades: '500+', fonte: 'Dado interno', nos: true },
  { marca: '[solidcore]', pais: 'EUA', unidades: '160', fonte: 'HFA 2026 (dados 2025)' },
  { marca: 'KX Pilates', pais: 'Austrália', unidades: '140+', fonte: 'Fonte externa, ago/2026' },
  { marca: 'STRONG Pilates', pais: 'Austrália', unidades: '120+', fonte: 'Fonte externa, jul/2026' },
  { marca: 'JETSET Pilates', pais: 'EUA', unidades: '60+', fonte: 'Fonte externa, abr/2026' },
  { marca: 'Guiwei Yoga & Pilates', pais: 'China', unidades: '26', fonte: 'HFA 2025 (dados 2024)' },
  { marca: 'Pilates Studio Brasil', pais: 'Brasil', unidades: '20', fonte: 'HFA 2025 (dados 2024)' },
];

export const Ranking = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={MATERIAS.segundaMaior.pagina + 2}>
    <Miolo>
      <h2 className="em-display text-[92px] font-extrabold uppercase leading-[0.86] tracking-[-0.01em]">
        {MATERIAS.segundaMaior.titulo}
      </h2>
      <div className="em-display mt-[40px] text-[30px] font-bold uppercase leading-none">
        Maiores marcas de estúdios de Pilates do mundo
      </div>
      <div className="em-serif mt-[6px] text-[18px] text-[var(--em-tinta)]/70">
        Ranking por número de unidades em operação
      </div>

      <table className="mt-[16px] w-full border-collapse">
        <thead>
          <tr className="em-sans border-b-2 border-[var(--em-tinta)] text-left text-[12px] font-bold uppercase tracking-[0.14em] text-[var(--em-tinta)]/60">
            <th className="w-[36px] py-[8px] font-bold">#</th>
            <th className="py-[8px] font-bold">Marca</th>
            <th className="py-[8px] font-bold">País</th>
            <th className="py-[8px] pr-[16px] text-right font-bold">Unidades</th>
            <th className="py-[8px] font-bold">Fonte / Data</th>
          </tr>
        </thead>
        <tbody>
          {RANKING.map((r, i) => (
            <tr key={r.marca} className={r.nos ? 'bg-[#a9293b] text-[#f7ecdc]' : 'border-b border-black/10'}>
              <td className={`em-display py-[9px] pl-[4px] text-[24px] font-extrabold ${r.nos ? '' : 'text-[var(--em-vinho)]'}`}>
                {i + 1}
              </td>
              <td className={`em-serif whitespace-nowrap py-[9px] text-[18px] ${r.nos ? 'font-bold' : ''}`}>{r.marca}</td>
              <td className={`em-serif whitespace-nowrap py-[9px] text-[16px] ${r.nos ? 'font-bold' : ''}`}>{r.pais}</td>
              <td className="em-display py-[9px] pr-[16px] text-right text-[24px] font-bold">{r.unidades}</td>
              <td className={`em-serif whitespace-nowrap py-[9px] text-[14.5px] ${r.nos ? 'font-bold' : 'opacity-75'}`}>{r.fonte}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="em-serif mt-auto text-[14px] leading-[1.45] text-[var(--em-tinta)]/60">
        Fontes: HFA Global Report 2025 e 2026; comunicados das marcas (KX Pilates, STRONG Pilates, JETSET Pilates).
        Pure Pilates: dado interno. [solidcore] é um método em reformer inspirado no Pilates. Marcas de barre (Pure
        Barre, barre3) não incluídas.
      </p>
    </Miolo>
  </Pagina>
);
