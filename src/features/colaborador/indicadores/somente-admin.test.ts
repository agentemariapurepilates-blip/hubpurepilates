import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// A área de Dashboard é SÓ PARA ADMIN por decisão de produto: ela mostra os
// números de todas as unidades da rede, lidos de um banco de produção
// compartilhado com o painel do Cloudflare. Colaborador não deve nem ver que
// ela existe.
//
// Esta trava existe porque a regra é fácil de furar sem ninguém notar: basta
// alguém acrescentar uma tela nova copiando a linha da tela ao lado. Até
// 04/08/2026 as seis rotas estavam com `requireColaborador`, e qualquer
// colaborador entrava.

const APP = 'src/App.tsx';
const SIDEBAR = 'src/components/layout/Sidebar.tsx';

/** Captura cada <Route path="/dashboard/..."> e a proteção declarada nela. */
const ROTA_DO_DASHBOARD = /<Route\s+path="(\/dashboard\/[^"]*)"\s+element=\{<ProtectedRoute\s+(\w+)?/g;

const MOTIVO_ROTA =
  'Toda rota /dashboard/* precisa de <ProtectedRoute requireAdmin>. Com requireColaborador ' +
  'qualquer colaborador abre a tela pela URL, mesmo sem o item no menu — esconder o menu não ' +
  'protege nada sozinho. Se uma tela do Dashboard puder mesmo ser vista por colaborador, a ' +
  'mudança é de produto: converse antes e ajuste este teste junto.';

const MOTIVO_MENU =
  'A seção Dashboard do menu tem que estar sob `isAdmin &&`. Com `isColaborador` ela reaparece ' +
  'para quem não pode abrir nenhuma das telas, e o usuário leva um redirecionamento sem ' +
  'explicação ao clicar.';

describe('área de Dashboard é só para admin', () => {
  it('todas as rotas /dashboard/* exigem admin', () => {
    const app = readFileSync(APP, 'utf8');
    const rotas = [...app.matchAll(ROTA_DO_DASHBOARD)];

    // Se o casamento parar de funcionar (alguém reformatou o JSX), o teste
    // falha em vez de passar vazio dando falsa sensação de cobertura.
    expect(rotas.length, 'nenhuma rota /dashboard/* encontrada em App.tsx').toBeGreaterThan(0);

    const desprotegidas = rotas
      .filter(([, , protecao]) => protecao !== 'requireAdmin')
      .map(([, caminho, protecao]) => `${caminho} → ${protecao ?? '(sem proteção)'}`);

    expect(desprotegidas, MOTIVO_ROTA).toEqual([]);
  });

  it('a seção do menu só aparece para admin', () => {
    const sidebar = readFileSync(SIDEBAR, 'utf8');

    // Pega o trecho entre o comentário da seção e o Collapsible dela.
    const trecho = sidebar.slice(
      sidebar.indexOf('Dashboard — Painel de Indicadores'),
      sidebar.indexOf("openSection === 'dashboard'"),
    );

    expect(trecho, 'não achei a seção Dashboard no Sidebar').not.toBe('');
    expect(trecho.includes('{isAdmin && ('), MOTIVO_MENU).toBe(true);
    expect(trecho.includes('isColaborador'), MOTIVO_MENU).toBe(false);
  });

  it('o item de Clusters está dentro da navegação do Dashboard', () => {
    // A tela de clusters entrou depois das outras; este caso garante que ela
    // herda a mesma proteção em vez de virar um item solto em outra seção.
    const sidebar = readFileSync(SIDEBAR, 'utf8');
    const navegacao = sidebar.slice(
      sidebar.indexOf('const dashboardNavigation'),
      sidebar.indexOf('];', sidebar.indexOf('const dashboardNavigation')),
    );
    expect(navegacao).toContain('/dashboard/clusters-matriculados');
  });
});
