import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Proxy de desenvolvimento para as abas Relatório e Integração do Dashboard.
//
// POR QUE ISSO EXISTE
// As tabelas report_recipients, report_settings e integration_logs do projeto
// de indicadores exigem sessão de administrador DAQUELE projeto (RLS com
// has_role). O Hub lê aquele banco de forma anônima, então elas voltam com
// zero linhas. A única forma de ler é com a chave de serviço — e chave de
// serviço NUNCA pode ir para o navegador, porque daria poder total sobre o
// banco a qualquer visitante.
//
// COMO ISSO É SEGURO
// A chave é lida como INDICADORES_SERVICE_KEY, SEM o prefixo VITE_. O Vite só
// injeta no código do navegador as variáveis prefixadas com VITE_, então esta
// fica exclusivamente no processo Node do servidor de desenvolvimento. O
// navegador recebe apenas o JSON já consultado.
//
// LIMITES DELIBERADOS
// - `apply: 'serve'` — o plugin não existe no build de produção.
// - Só responde a GET. Não há caminho de escrita, coerente com a garantia de
//   somente-consulta da área de Dashboard.
// - Só as três tabelas da lista. Não é um proxy genérico para o banco.
// - `order` e `limit` são validados por formato antes de repassados.
const TABELAS_PERMITIDAS = ['report_recipients', 'report_settings', 'integration_logs'];

function indicadoresDevProxy(env: Record<string, string>): Plugin {
  return {
    name: 'indicadores-dev-proxy',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api-dev/indicadores', async (req, res) => {
        const responder = (status: number, corpo: unknown) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify(corpo));
        };

        if (req.method !== 'GET') {
          return responder(405, { erro: 'Somente GET. Esta área é de consulta.' });
        }

        const url = new URL(req.url ?? '', 'http://localhost');
        const tabela = url.pathname.replace(/^\//, '');

        if (!TABELAS_PERMITIDAS.includes(tabela)) {
          return responder(404, {
            erro: `Tabela "${tabela}" não está liberada. Permitidas: ${TABELAS_PERMITIDAS.join(', ')}.`,
          });
        }

        const base = env.VITE_INDICADORES_SUPABASE_URL;
        const chave = env.INDICADORES_SERVICE_KEY;

        if (!base || !chave) {
          return responder(503, {
            erro:
              'INDICADORES_SERVICE_KEY não está definida no .env.local. ' +
              'Pegue a chave service_role no painel do Supabase do projeto de indicadores ' +
              '(Project Settings → API) e cole no .env.local. Sem ela, as abas Relatório e ' +
              'Integração não têm como ler os dados.',
          });
        }

        // Só repassa parâmetros com formato conhecido — nada de query arbitrária.
        const consulta = new URLSearchParams({ select: '*' });
        const order = url.searchParams.get('order');
        const limit = url.searchParams.get('limit');
        if (order && /^[a-z_]+\.(asc|desc)$/.test(order)) consulta.set('order', order);
        if (limit && /^\d{1,4}$/.test(limit)) consulta.set('limit', limit);

        try {
          const resposta = await fetch(`${base}/rest/v1/${tabela}?${consulta}`, {
            headers: { apikey: chave, Authorization: `Bearer ${chave}` },
          });
          const texto = await resposta.text();
          res.statusCode = resposta.status;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(texto);
        } catch (e) {
          responder(502, {
            erro: `Não foi possível falar com o banco de indicadores: ${(e as Error).message}`,
          });
        }
      });
    },
  };
}

/**
 * As variáveis sem as quais o BUILD não pode ser publicado.
 *
 * O Dashboard lê um projeto Supabase diferente do resto do Hub, e as
 * credenciais dele moram no `.env.local` — que não é versionado, porque tem
 * chave. As do Hub estão no `.env`, que é.
 *
 * Em 27/08/2026 alguém compilou numa máquina sem o `.env.local`. O Vite trocou
 * as duas por `undefined`, `integrations/supabase/indicadores.ts` passou a
 * lançar erro ao ser carregado, e TODA tela de Dashboard morria — enquanto
 * Feed, Leads RH e PurePedia seguiam de pé, porque dependem do `.env`. Um
 * sistema meio funcionando é mais difícil de diagnosticar do que um fora do ar.
 *
 * Nada avisou: o build passou, os testes passaram e o deploy disse "sucesso".
 * O erro só aparecia no console do navegador de quem abrisse o Dashboard.
 */
const OBRIGATORIAS_NO_BUILD = [
  'VITE_INDICADORES_SUPABASE_URL',
  'VITE_INDICADORES_SUPABASE_ANON_KEY',
];

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Prefixo '' carrega TODAS as variáveis, inclusive as sem VITE_. Isso vale só
  // aqui, no processo Node — nada disso é injetado no código do navegador.
  const env = loadEnv(mode, process.cwd(), '');

  // A checagem vale SÓ para `build`, e é de propósito.
  //
  // `dev` e os testes continuam rodando sem o `.env.local`: quem está mexendo
  // no Feed ou na Pure Store não precisa da credencial do Dashboard, e exigir
  // isso travaria o trabalho de quem nunca chega perto daquelas telas. Ali o
  // erro em tempo de execução já explica o que falta, e só para quem abrir a
  // tela.
  //
  // No build é diferente: o artefato quebrado vai para produção e afeta todo
  // mundo. Falhar aqui é a última hora em que o erro ainda é barato.
  if (command === 'build' && !process.env.VITEST) {
    const faltando = OBRIGATORIAS_NO_BUILD.filter((nome) => !env[nome]);

    if (faltando.length > 0) {
      throw new Error(
        [
          '',
          '─'.repeat(70),
          '  BUILD INTERROMPIDO — faltam credenciais do Dashboard',
          '─'.repeat(70),
          '',
          `  Não encontrei no .env.local: ${faltando.join(', ')}`,
          '',
          '  Sem elas o build até termina, mas TODA tela de Dashboard quebra em',
          '  produção, e o resto do Hub continua funcionando — o que torna o',
          '  problema difícil de perceber e de diagnosticar.',
          '',
          '  Como resolver:',
          '    1. Copie o .env.local.example para .env.local',
          '    2. Preencha as duas variáveis com os dados do projeto Supabase',
          '       de indicadores (Project Settings → API)',
          '',
          '  O .env.local não é versionado de propósito: contém credencial.',
          '  Cada máquina que compila para produção precisa ter o seu.',
          '',
          '─'.repeat(70),
        ].join('\n'),
      );
    }
  }

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [react(), indicadoresDevProxy(env)],
    build: {
      // Os chunks saem em /app/ e não no /assets/ padrão do Vite.
      //
      // POR QUE: em 03/08/2026 o Hub ficou fora do ar com tela branca. O
      // `web.config` transforma QUALQUER 404 em `/index.html` com status 200
      // (httpErrors existingResponse="Replace"). Durante o upload do deploy, os
      // chunks que ainda não tinham chegado foram pedidos e receberam esse HTML
      // com 200 -- e o Cloudflare, que fica na frente do domínio, guardou o HTML
      // como se fosse o JavaScript, com max-age=14400 (4 horas). O navegador
      // recusa por MIME type e a tela fica branca.
      //
      // Não temos acesso ao Cloudflare para purgar, então a saída foi mudar o
      // caminho: URLs que ele nunca viu não têm entrada envenenada em cache.
      //
      // Isto trata o SINTOMA. A causa é o `web.config` responder 200 para
      // arquivo inexistente, e está corrigida separadamente em
      // publish/root-web.config -- com 404 de verdade, o Cloudflare não cacheia
      // e um deploy incompleto vira erro isolado em vez de site fora do ar.
      assetsDir: 'app',
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
