// Análise de mídia paga escrita por IA.
//
// A função é fina de propósito: ela NÃO monta o prompt e NÃO lê o banco. O
// prompt inteiro — manual do Cérebro, números do período e achados das regras —
// é montado no navegador, em `src/features/colaborador/midia-paga/lib/prompt-da-ia.ts`,
// e chega aqui pronto. Assim o que a IA recebe é exatamente o que a tela mostra
// no botão "Copiar prompt", e não existe uma segunda versão do manual escondida
// no servidor para descolar da primeira.
//
// O que mora aqui e não pode morar no navegador é a chave da Anthropic.
//
// NÃO PUBLICADA. Enquanto o deploy não for pedido, a tela cai no caminho de
// copiar o prompt e diz isso ao usuário. Para publicar:
//   supabase functions deploy midia-analise-ia --project-ref evprrtvbvjnjixogjsmn
// A ANTHROPIC_API_KEY já existe nos secrets do projeto.

import { getCorsHeaders } from '../_shared/cors.ts';

const MODELO = 'claude-opus-5';
const MAXIMO_DE_CARACTERES = 200_000;

const responder = (req: Request) => (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), {
    status,
    headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: getCorsHeaders(req) });

  const json = responder(req);

  try {
    // Só admin do Hub. A função gasta token da conta a cada chamada, então a
    // porta é fechada aqui e não só na rota da tela.
    const autorizacao = req.headers.get('Authorization');
    if (!autorizacao) return json({ erro: 'sem credencial' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !anonKey) return json({ erro: 'ambiente incompleto' }, 500);

    const usuario = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: autorizacao, apikey: anonKey },
    });
    if (!usuario.ok) return json({ erro: 'credencial inválida' }, 401);

    // O gate é `dpp_profiles.role`, e não `user_roles` do Hub, de propósito: é
    // essa a lista que a RLS das tabelas de mídia usa (`dpp_is_admin()`). Quem
    // não está nela enxerga apenas as próprias unidades, e mandar um recorte
    // parcial para a IA produziria um relatório com cara de rede inteira.
    const { id } = await usuario.json();
    const perfil = await fetch(`${supabaseUrl}/rest/v1/dpp_profiles?select=role&id=eq.${id}`, {
      headers: { Authorization: autorizacao, apikey: anonKey },
    });
    const perfis = perfil.ok ? await perfil.json() : [];
    if (perfis[0]?.role !== 'admin') {
      return json({ erro: 'somente administrador do módulo de mídia' }, 403);
    }

    const { prompt } = await req.json().catch(() => ({ prompt: null }));
    if (typeof prompt !== 'string' || prompt.trim().length === 0) {
      return json({ erro: 'prompt vazio' }, 400);
    }
    if (prompt.length > MAXIMO_DE_CARACTERES) {
      // Um período muito longo com muitos conjuntos monta um prompt enorme.
      // Recusar com o número na mão é melhor que estourar o limite do modelo e
      // devolver um erro que não diz o que fazer.
      return json(
        {
          erro: `prompt com ${prompt.length} caracteres, acima do limite de ${MAXIMO_DE_CARACTERES}. ` +
            'Escolha um período menor.',
        },
        413,
      );
    }

    const chave = Deno.env.get('ANTHROPIC_API_KEY');
    if (!chave) return json({ erro: 'ANTHROPIC_API_KEY não configurada' }, 500);

    const resposta = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': chave,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODELO,
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!resposta.ok) {
      const detalhe = await resposta.text();
      return json({ erro: `Anthropic ${resposta.status}`, detalhe: detalhe.slice(0, 500) }, 502);
    }

    const corpo = await resposta.json();
    const texto = (corpo.content ?? [])
      .filter((bloco: { type: string }) => bloco.type === 'text')
      .map((bloco: { text: string }) => bloco.text)
      .join('\n');

    if (!texto) return json({ erro: 'a IA respondeu sem texto' }, 502);

    return json({ texto, modelo: MODELO });
  } catch (e) {
    return json({ erro: e instanceof Error ? e.message : String(e) }, 500);
  }
});
