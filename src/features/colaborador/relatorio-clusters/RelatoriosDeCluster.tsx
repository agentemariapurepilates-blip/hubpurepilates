import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DestinatariosClustersTab } from './DestinatariosClustersTab';
import { DestinatariosExperimentaisTab } from './DestinatariosExperimentaisTab';
import { PreviaDoRelatorio, type HooksDaPrevia } from './PreviaDoRelatorio';
import { criarHooksDePrevia } from './hooks/usePreviaRelatorio';
import { RELATORIOS, type Relatorio } from './lib/relatorios';

/**
 * Os hooks de prévia nascem no escopo do módulo porque a fábrica DEVOLVE
 * hooks: recriá-los a cada render trocaria a identidade das funções a toda
 * pintura da tela, e o React não tem como saber que são as mesmas.
 */
const HOOKS_DE_PREVIA: Record<Relatorio, HooksDaPrevia> = {
  matriculados: criarHooksDePrevia(RELATORIOS.matriculados.funcao),
  experimentais: criarHooksDePrevia(RELATORIOS.experimentais.funcao),
};

/**
 * Os dois relatórios por e-mail da área de clusters, cada um com a sua lista
 * de destinatários e a sua prévia. Mora na subaba Clusters da Administração.
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
          {(Object.keys(RELATORIOS) as Relatorio[]).map((chave) => (
            <TabsTrigger key={chave} value={chave}>
              {RELATORIOS[chave].rotulo}
            </TabsTrigger>
          ))}
        </TabsList>

        <p className="pt-3 text-sm text-muted-foreground">{RELATORIOS[aba].descricao}</p>

        {/* Só a aba ativa fica montada — é o padrão do Radix, e é o que impede
            a tela de montar os DOIS e-mails ao abrir. Cada prévia lê ~475
            unidades em dois bancos diferentes. */}
        <TabsContent value="matriculados" className="space-y-4 pt-2">
          <DestinatariosClustersTab />
          <PreviaDoRelatorio
            hooks={HOOKS_DE_PREVIA.matriculados}
            nomeDoRelatorio={RELATORIOS.matriculados.nomeNoTexto}
          />
        </TabsContent>

        <TabsContent value="experimentais" className="space-y-4 pt-2">
          <DestinatariosExperimentaisTab />
          <PreviaDoRelatorio
            hooks={HOOKS_DE_PREVIA.experimentais}
            nomeDoRelatorio={RELATORIOS.experimentais.nomeNoTexto}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
