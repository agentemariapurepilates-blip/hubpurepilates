import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// Onde a configuração dos relatórios por e-mail aparece na tela.
//
// Ela nasceu escondida atrás de um botão na página Clusters de Matriculados, e
// mudou para a subaba Clusters da Administração, junto das outras configurações
// do painel. Uma tela de dados não é lugar de cadastrar quem recebe e-mail.
//
// O teste é de varredura, e não de render: o que importa aqui é o lugar, e
// montar o ClusterGeneratorTab de verdade exigiria o banco de indicadores
// inteiro para provar um fato que o import já diz.

const GERADOR = 'src/features/colaborador/indicadores/components/admin/ClusterGeneratorTab.tsx';
const PAGINA_DE_CLUSTERS = 'src/features/colaborador/indicadores/ClustersMatriculados.tsx';
const PAINEL = 'RelatoriosDeCluster';

const MOTIVO_SAIDA =
  'A página Clusters de Matriculados voltou a trazer a configuração de relatório. Ela agora ' +
  'mora na subaba Clusters da Administração — dois lugares para a mesma coisa é como uma das ' +
  'duas telas fica para trás sem ninguém notar.';

describe('o painel de relatórios mora na Administração', () => {
  it('a subaba Clusters renderiza o painel', () => {
    const gerador = readFileSync(GERADOR, 'utf8');

    expect(gerador).toContain(`import { ${PAINEL} }`);
    expect(gerador).toContain(`<${PAINEL} />`);
  });

  it('a página Clusters de Matriculados não o traz mais', () => {
    const pagina = readFileSync(PAGINA_DE_CLUSTERS, 'utf8');

    expect(pagina.includes(PAINEL), MOTIVO_SAIDA).toBe(false);
  });

  it('a página de clusters não guardou o botão que abria o painel', () => {
    // O toggle continuava no ar depois da mudança numa primeira tentativa:
    // aparecia, alternava um estado e não revelava mais nada.
    const pagina = readFileSync(PAGINA_DE_CLUSTERS, 'utf8');

    expect(pagina).not.toContain('noRelatorio');
  });
});
