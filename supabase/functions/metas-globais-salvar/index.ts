// Grava as METAS GLOBAIS DIÁRIAS da aba Metas, no Hub PUBLICADO.
//
// POR QUE ELA EXISTE
// A aba passou a cadastrar metas em 24/09/2026 (fc4e560), mas só com o Hub
// rodando na máquina: a gravação ia para o proxy do `npm run dev`, que é quem
// tinha a chave de serviço do banco de indicadores. Em hub.purepilates.com.br
// não havia proxy nenhum, então a aba continuava somente consulta — foi o que
// o Renan encontrou em 16/09 ao tentar cadastrar outubro. A chave não pode ir
// para o navegador; então quem grava passou a ser esta function.
//
// A REGRA NÃO MORA AQUI
// Validação, gravação e releitura estão em `_shared/metas-globais.ts`, o mesmo
// arquivo que os testes do Vitest chamam. Este index é só a porta: quem é,
// pode, e com que conexão. Copiar a regra para cá seria criar uma segunda
// versão dela para divergir em silêncio.
//
// DOIS BANCOS, e eles não se misturam
// A identidade é do projeto do HUB (`SUPABASE_URL`/`SUPABASE_ANON_KEY`, que a
// própria plataforma injeta). A gravação é no projeto de INDICADORES, que é
// outro, e por isso a URL e a chave dele vêm de variáveis próprias.
//
// SÓ ADMIN DO HUB. `adminDoHub` consulta `user_roles` com o JWT de quem
// chamou, não com a service_role — quem não é admin não acha a linha, e a
// garantia fica com a RLS em vez de ficar com a memória de quem escreve a
// function.

import { getCorsHeaders } from '../_shared/cors.ts';
import { adminDoHub } from '../_shared/admin-do-hub.ts';
import { ErroDeMetas, salvarMetasGlobais, validarPedido } from '../_shared/metas-globais.ts';

// A URL é pública — já vai no bundle do frontend como VITE_INDICADORES_
// SUPABASE_URL. O padrão aqui é o mesmo de experimentais-relatorio-mensal: a
// variável de ambiente ganha, para o dia em que o projeto mudar de endereço.
const INDICADORES_URL = Deno.env.get('INDICADORES_SUPABASE_URL')
  || 'https://bweyyihedqnckbtzbkie.supabase.co';

/**
 * A chave de serviço NÃO tem padrão, de propósito.
 *
 * Ela ignora a RLS do banco de indicadores inteiro. Um valor embutido aqui
 * seria um segredo no repositório; um valor errado gravaria em lugar nenhum e
 * diria que gravou. Sem ela a function responde 503 com o que fazer — o mesmo
 * código que o proxy usava, e que a tela já sabe distinguir de falha.
 */
const CHAVE_DE_SERVICO = Deno.env.get('INDICADORES_SERVICE_KEY');

function json(corpo: unknown, status: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);

  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  if (req.method !== 'PUT') {
    return json({ erro: `Método ${req.method} não atendido aqui. Use PUT.` }, 405, cors);
  }

  const admin = await adminDoHub(req.headers.get('Authorization'));
  if (!admin) {
    return json({ erro: 'Só administradores do Hub podem cadastrar metas.' }, 403, cors);
  }

  if (!CHAVE_DE_SERVICO) {
    return json({
      erro: 'INDICADORES_SERVICE_KEY não está configurada nesta function. Pegue a chave '
        + 'service_role no painel do Supabase do projeto de indicadores (Project Settings → '
        + 'API) e grave como segredo da Edge Function. Sem ela não há como salvar metas.',
    }, 503, cors);
  }

  /*
   * O mês vai no CORPO, e não no caminho.
   *
   * A rota da function é o nome dela; o que vem depois da barra não é
   * roteado por ninguém. Deixar o mês no caminho daria uma URL que parece
   * certa e é ignorada — o pedido gravaria no mês errado sem erro nenhum.
   */
  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    return json({ erro: 'Corpo não é JSON válido.' }, 400, cors);
  }

  const mes = (corpo as { mes?: unknown } | null)?.mes;
  if (typeof mes !== 'string') {
    return json({ erro: 'Falta `mes` no corpo, no formato AAAA-MM.' }, 400, cors);
  }

  try {
    const metas = validarPedido(mes, corpo);
    const resultado = await salvarMetasGlobais(
      { base: INDICADORES_URL, chave: CHAVE_DE_SERVICO },
      mes,
      metas,
    );
    return json(resultado, 200, cors);
  } catch (e) {
    if (e instanceof ErroDeMetas) return json({ erro: e.message }, e.status, cors);
    return json(
      { erro: `Não foi possível falar com o banco de indicadores: ${(e as Error).message}` },
      502,
      cors,
    );
  }
});
