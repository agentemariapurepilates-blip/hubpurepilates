import { Label } from '@/components/ui/label';
import { SceneEntry, sceneCena, sceneNarracao } from './types';

interface CenasTableProps {
  cenas: SceneEntry[];
}

/**
 * Tabela 2 colunas (Cena | Narracao) com header vermelho Pure e zebrado.
 * Espelha o layout do template HTML em public/roteiro-template-video.html.
 */
export function CenasTable({ cenas }: CenasTableProps) {
  if (cenas.length === 0) {
    return <p className="text-xs text-muted-foreground italic">Cenas ainda não geradas. Refine com IA pra criar.</p>;
  }

  return (
    <div className="space-y-2">
      <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
        Cenas ({cenas.length})
      </Label>
      <div className="overflow-x-auto rounded-md border border-rose-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#c10230] text-white">
              <th className="text-left px-3 py-2 font-semibold w-1/2">Cena</th>
              <th className="text-left px-3 py-2 font-semibold w-1/2">Narração</th>
            </tr>
          </thead>
          <tbody>
            {cenas.map((c, idx) => (
              <tr key={c.numero} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                <td className="px-3 py-3 align-top leading-relaxed">{sceneCena(c) || '-'}</td>
                <td className="px-3 py-3 align-top leading-relaxed">{sceneNarracao(c) || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
