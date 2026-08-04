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

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Prefixo '' carrega TODAS as variáveis, inclusive as sem VITE_. Isso vale só
  // aqui, no processo Node — nada disso é injetado no código do navegador.
  const env = loadEnv(mode, process.cwd(), '');

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
