import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Período da análise.
 *
 * Os atalhos existem porque quase toda leitura de mídia é uma destas quatro, e
 * digitar data à mão convida a comparar 28 dias com 31 sem perceber.
 */

function primeiroDia(data: Date): string {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-01`;
}

function comoTexto(data: Date): string {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(
    data.getDate(),
  ).padStart(2, '0')}`;
}

export interface Periodo {
  de: string;
  ate: string;
}

export function atalhos(hoje = new Date()): Array<{ rotulo: string; periodo: Periodo }> {
  const ontem = new Date(hoje);
  ontem.setDate(ontem.getDate() - 1);

  const trintaDias = new Date(hoje);
  trintaDias.setDate(trintaDias.getDate() - 30);

  const mesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
  const fimDoMesPassado = new Date(hoje.getFullYear(), hoje.getMonth(), 0);

  const tresMeses = new Date(hoje.getFullYear(), hoje.getMonth() - 3, 1);

  return [
    { rotulo: 'Últimos 30 dias', periodo: { de: comoTexto(trintaDias), ate: comoTexto(ontem) } },
    {
      rotulo: 'Mês corrente',
      periodo: { de: primeiroDia(hoje), ate: comoTexto(ontem) },
    },
    {
      rotulo: 'Mês passado',
      periodo: { de: primeiroDia(mesPassado), ate: comoTexto(fimDoMesPassado) },
    },
    {
      rotulo: 'Últimos 3 meses',
      periodo: { de: primeiroDia(tresMeses), ate: comoTexto(fimDoMesPassado) },
    },
  ];
}

export function SeletorDePeriodo({
  periodo,
  aoMudar,
}: {
  periodo: Periodo;
  aoMudar: (novo: Periodo) => void;
}) {
  const opcoes = atalhos();

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-wrap gap-2">
        {opcoes.map((opcao) => {
          const ativo = opcao.periodo.de === periodo.de && opcao.periodo.ate === periodo.ate;
          return (
            <Button
              key={opcao.rotulo}
              variant={ativo ? 'default' : 'outline'}
              size="sm"
              onClick={() => aoMudar(opcao.periodo)}
            >
              {opcao.rotulo}
            </Button>
          );
        })}
      </div>

      <div className="flex items-end gap-2">
        <div>
          <Label htmlFor="periodo-de" className="text-xs text-muted-foreground">
            De
          </Label>
          <Input
            id="periodo-de"
            type="date"
            value={periodo.de}
            max={periodo.ate}
            onChange={(e) => aoMudar({ ...periodo, de: e.target.value })}
            className="h-9 w-[9.5rem]"
          />
        </div>
        <div>
          <Label htmlFor="periodo-ate" className="text-xs text-muted-foreground">
            Até
          </Label>
          <Input
            id="periodo-ate"
            type="date"
            value={periodo.ate}
            min={periodo.de}
            onChange={(e) => aoMudar({ ...periodo, ate: e.target.value })}
            className="h-9 w-[9.5rem]"
          />
        </div>
      </div>
    </div>
  );
}
