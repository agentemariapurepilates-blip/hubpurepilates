import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DestinatariosClustersTab } from './DestinatariosClustersTab';
import { DestinatariosExperimentaisTab } from './DestinatariosExperimentaisTab';

type Relatorio = 'matriculados' | 'experimentais';

const DESCRICAO: Record<Relatorio, string> = {
  matriculados:
    'Todo dia 1, às 3h. Quantas unidades ficaram em cada cluster no mês que fechou, comparado com o mês anterior.',
  experimentais:
    'No penúltimo dia de cada mês, às 3h. Unidades divididas em Bom (30+), Regular (20 a 29) e Ruim (0 a 19) pela média de aulas experimentais dos 3 últimos meses.',
};

/**
 * Os dois relatórios por e-mail da área de clusters, cada um com a sua lista.
 *
 * Duas listas separadas, e não uma com caixinhas de seleção: são recortes
 * diferentes da rede — quem acompanha a base de alunos (matriculados) não é
 * necessariamente quem acompanha captação (experimentais). Juntar obrigaria
 * todo mundo a receber os dois ou criaria uma matriz de flags numa tabela que
 * hoje tem um propósito só.
 */
export function RelatoriosDeCluster() {
  const [aba, setAba] = useState<Relatorio>('matriculados');

  return (
    <div className="space-y-4">
      <Tabs value={aba} onValueChange={(v) => setAba(v as Relatorio)}>
        <TabsList>
          <TabsTrigger value="matriculados">Matriculados</TabsTrigger>
          <TabsTrigger value="experimentais">Aulas experimentais</TabsTrigger>
        </TabsList>

        <p className="pt-3 text-sm text-muted-foreground">{DESCRICAO[aba]}</p>

        <TabsContent value="matriculados" className="pt-2">
          <DestinatariosClustersTab />
        </TabsContent>

        <TabsContent value="experimentais" className="pt-2">
          <DestinatariosExperimentaisTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
