// Cron: relatorio mensal de clusters de matriculados. Disparada por pg_cron
// todo dia 1 as 03:00 de Sao Paulo (06:00 UTC).
//
// NAO PUBLICADA AINDA, a pedido do usuario.
//
// ESTA FUNCTION FALA COM DOIS BANCOS, e e o unico lugar do sistema que faz
// isso:
//   - banco de INDICADORES (bweyyihedqnckbtzbkie): de onde vem quantos alunos
//     cada unidade tem. Leitura anonima, igual ao que o Hub ja faz no navegador
//     -- a anon key deste projeto e publica, esta no bundle do frontend.
//   - banco do HUB: de onde vem a lista de destinatarios, com a chave de
//     servico.
//
// A separacao e deliberada: a area de Dashboard nunca escreve no banco de
// indicadores (ver sem-escrita.test.ts), entao a lista de quem recebe mora no
// Hub, junto com as outras duas listas de e-mail.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { contar, montarEmailDeClusters, mesAnterior } from './email.ts';

const N8N_WEBHOOK_URL = Deno.env.get('CLUSTERS_WEBHOOK_URL')
  || 'https://backend.purepilates.com.br/webhook/relatorio-clusters';

const WEBHOOK_TIMEOUT_MS = 60_000;
const WEBHOOK_HEADER = 'x-inauguracao-token';

// Coluna do ESTOQUE de alunos. Existe uma `cli_matriculas_total` (fluxo) com
// nome quase identico: trocar as duas poe todas as unidades no Cluster 5.
const COLUNA = 'cli_matriculados_total';

// Valores publicos — a anon key deste projeto ja e distribuida no bundle do
// frontend. Ficam como default para a function nao depender de segredo novo.
const INDICADORES_URL = Deno.env.get('INDICADORES_SUPABASE_URL')
  || 'https://bweyyihedqnckbtzbkie.supabase.co';
// Sem segredo: esta chave ja e distribuida no bundle do frontend, entao
// mante-la aqui nao expoe nada novo. A variavel de ambiente continua tendo
// prioridade, para o dia em que o projeto rotacionar a chave.
const INDICADORES_ANON = Deno.env.get('INDICADORES_SUPABASE_ANON_KEY')
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3ZXl5aWhlZHFuY2tidHpia2llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNzI3NjIsImV4cCI6MjA4MDk0ODc2Mn0.y87s13__DraHC-1ANCMknr1Uo4-TZzdr1tov2phr9rI';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function segredoEsperado(): string {
  return Deno.env.get('INAUGURACAO_CRON_SECRET') || Deno.env.get('INSTAGRAM_CRON_SECRET') || '';
}

/** Mes corrente em Sao Paulo, 'YYYY-MM'. */
function mesEmSaoPaulo(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit',
  }).format(new Date()).slice(0, 7);
}

function ultimoDiaDoMes(mes: string): string {
  const [ano, m] = mes.split('-').map(Number);
  return new Date(Date.UTC(ano, m, 0)).toISOString().slice(0, 10);
}

/**
 * Os valores de cada unidade no ultimo dia COM DADO do mes.
 *
 * Duas requisicoes por mes, e nao uma: o mes inteiro sao ~475 unidades x 31
 * dias = 14 mil linhas, acima do teto do PostgREST. Como o indicador e estoque,
 * so o ultimo dia interessa -- a primeira requisicao descobre qual e, a segunda
 * traz ~475 linhas.
 */
async function valoresDoMes(mes: string): Promise<number[]> {
  const cabecalho = { apikey: INDICADORES_ANON, Authorization: 'Bearer ' + INDICADORES_ANON };
  const base = `${INDICADORES_URL}/rest/v1/raw_consolidated_daily`;

  const respDia = await fetch(
    `${base}?select=date&date=gte.${mes}-01&date=lte.${ultimoDiaDoMes(mes)}&order=date.desc&limit=1`,
    { headers: cabecalho },
  );
  if (!respDia.ok) throw new Error(`indicadores (data) respondeu ${respDia.status}`);
  const dias = await respDia.json() as Array<{ date: string }>;
  if (dias.length === 0) return [];

  const resp = await fetch(
    `${base}?select=unit_id,${COLUNA}&date=eq.${dias[0].date}`,
    { headers: { ...cabecalho, Range: '0-4999' } },
  );
  if (!resp.ok) throw new Error(`indicadores (valores) respondeu ${resp.status}`);

  const linhas = await resp.json() as Array<Record<string, unknown>>;
  return linhas.map((l) => Number(l[COLUNA]) || 0);
}

Deno.serve(async (req) => {
  const segredo = segredoEsperado();
  if (!segredo || req.headers.get('authorization') !== `Bearer ${segredo}`) {
    return json({ error: 'unauthorized' }, 401);
  }

  if (!INDICADORES_ANON) {
    console.error('[relatorio-clusters] INDICADORES_SUPABASE_ANON_KEY nao configurada.');
    return json({ error: 'indicadores_anon_ausente' }, 500);
  }

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  try {
    // Roda no dia 1, entao o mes que interessa e o ANTERIOR ao corrente: e o
    // que acabou de fechar. Usar o mes corrente traria um unico dia de dado.
    const mesFechado = mesAnterior(mesEmSaoPaulo());
    const mesDeComparacao = mesAnterior(mesFechado);

    const { data: recipientsData, error: erroRecipients } = await sb
      .from('cluster_relatorio_recipients').select('email')
      .eq('ativo', true).order('email', { ascending: true });
    if (erroRecipients) throw erroRecipients;

    const destinatarios = (recipientsData ?? []).map((r) => r.email as string);

    // Lista vazia nao e erro: pode estar sendo montada. Diferente do aviso
    // diario de inauguracao, aqui nao ha oportunidade perdida -- o relatorio do
    // mes que vem tera os mesmos dados historicos.
    if (destinatarios.length === 0) {
      console.log(`[relatorio-clusters] ${mesFechado}: nenhum destinatario ativo. Nada enviado.`);
      return json({ ok: true, mes: mesFechado, destinatarios: 0, enviado: false });
    }

    const webhookToken = Deno.env.get('INAUGURACAO_WEBHOOK_TOKEN') || '';
    if (!webhookToken) {
      console.error(`[relatorio-clusters] ${mesFechado}: INAUGURACAO_WEBHOOK_TOKEN nao configurado.`);
      return json({ error: 'webhook_token_ausente', mes: mesFechado }, 500);
    }

    const atual = contar(await valoresDoMes(mesFechado));
    const anterior = contar(await valoresDoMes(mesDeComparacao));

    if (atual.total === 0) {
      console.error(`[relatorio-clusters] ${mesFechado}: nenhuma unidade com dado. Nada enviado.`);
      return json({ error: 'sem_dados_no_mes', mes: mesFechado }, 500);
    }

    const { assunto, corpo } = montarEmailDeClusters(mesFechado, atual, anterior);

    const resp = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', [WEBHOOK_HEADER]: webhookToken },
      body: JSON.stringify({ destinatarios, assunto, corpo }),
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
    });

    if (!resp.ok) {
      const texto = await resp.text();
      console.error(`[relatorio-clusters] ${mesFechado}: n8n respondeu ${resp.status}: ${texto.slice(0, 300)}`);
      return json({ error: 'falha_no_webhook_n8n', mes: mesFechado, detalhe: texto.slice(0, 300) }, 502);
    }

    console.log(`[relatorio-clusters] ${mesFechado}: enviado para ${destinatarios.length} destinatario(s). ${atual.total} unidades.`);
    return json({
      ok: true, mes: mesFechado,
      destinatarios: destinatarios.length,
      unidades: atual.total,
      enviado: true,
    });
  } catch (e) {
    console.error(`[relatorio-clusters] erro inesperado: ${String(e)}`);
    return json({ error: String(e) }, 500);
  }
});
