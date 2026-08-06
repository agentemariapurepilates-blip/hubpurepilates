// Cron: relatorio de AULAS EXPERIMENTAIS. Lista as unidades com a media dos 3
// ultimos meses (o vigente e os dois anteriores), divididas em BOM, MEDIO e
// RUIM -- os cortes saem dos tercis do proprio periodo, e nao de faixas fixas
// (ver email.ts).
//
// NAO PUBLICADA AINDA, a pedido do usuario.
//
// POR QUE O AGENDAMENTO E DIARIO e a decisao fica aqui:
// o pedido e "penultimo dia do mes", que varia entre 27 e 30 conforme o mes e o
// ano bissexto. O cron nao sabe expressar isso -- '0 6 28-30 * *' dispararia
// varias vezes em alguns meses e no dia errado em fevereiro. Entao o pg_cron
// chama TODO DIA as 06:00 UTC (03:00 de Sao Paulo) e a function sai logo no
// comeco se nao for o dia certo. Sair cedo custa uma invocacao vazia por dia,
// que e barato perto de mandar o relatorio no dia errado.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { montarEmailExperimentais, type LinhaDoRelatorio } from './email.ts';

const N8N_WEBHOOK_URL = Deno.env.get('EXPERIMENTAIS_WEBHOOK_URL')
  || 'https://backend.purepilates.com.br/webhook/relatorio-experimentais';

const WEBHOOK_TIMEOUT_MS = 60_000;
const WEBHOOK_HEADER = 'x-inauguracao-token';

// Contador que REINICIA a cada mes: o valor do mes e o do ultimo dia com dado,
// e nao a soma dos dias. Conferido nos dados -- a unidade 1 fecha julho em 12 e
// aparece em 1 no dia 01/08. Somar daria ~213.
const COLUNA = 'cli_experimentais';

const INDICADORES_URL = Deno.env.get('INDICADORES_SUPABASE_URL')
  || 'https://bweyyihedqnckbtzbkie.supabase.co';
const INDICADORES_ANON = Deno.env.get('INDICADORES_SUPABASE_ANON_KEY') || '';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function segredoEsperado(): string {
  return Deno.env.get('INAUGURACAO_CRON_SECRET') || Deno.env.get('INSTAGRAM_CRON_SECRET') || '';
}

/** Data de hoje em Sao Paulo, 'YYYY-MM-DD'. */
function hojeEmSaoPaulo(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
}

function penultimoDiaDoMes(ano: number, mes: number): string {
  const ultimo = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  return `${ano}-${String(mes).padStart(2, '0')}-${String(ultimo - 1).padStart(2, '0')}`;
}

function ehPenultimoDia(data: string): boolean {
  const [ano, mes] = data.split('-').map(Number);
  return data === penultimoDiaDoMes(ano, mes);
}

/** Os 3 meses: o vigente e os dois anteriores. */
function janelaDeTresMeses(mesVigente: string): string[] {
  const meses: string[] = [];
  let [ano, m] = mesVigente.split('-').map(Number);
  for (let i = 0; i < 3; i++) {
    meses.unshift(`${ano}-${String(m).padStart(2, '0')}`);
    m -= 1;
    if (m < 1) { m = 12; ano -= 1; }
  }
  return meses;
}

function ultimoDiaDoMes(mes: string): string {
  const [ano, m] = mes.split('-').map(Number);
  return new Date(Date.UTC(ano, m, 0)).toISOString().slice(0, 10);
}

const cabecalhoIndicadores = () => ({
  apikey: INDICADORES_ANON,
  Authorization: 'Bearer ' + INDICADORES_ANON,
});

/** Valor de cada unidade no ultimo dia com dado do mes. */
async function valoresDoMes(mes: string): Promise<Map<number, number>> {
  const base = `${INDICADORES_URL}/rest/v1/raw_consolidated_daily`;

  const respDia = await fetch(
    `${base}?select=date&date=gte.${mes}-01&date=lte.${ultimoDiaDoMes(mes)}&order=date.desc&limit=1`,
    { headers: cabecalhoIndicadores() },
  );
  if (!respDia.ok) throw new Error(`indicadores (data) respondeu ${respDia.status}`);
  const dias = await respDia.json() as Array<{ date: string }>;
  if (dias.length === 0) return new Map();

  const resp = await fetch(
    `${base}?select=unit_id,${COLUNA}&date=eq.${dias[0].date}`,
    { headers: { ...cabecalhoIndicadores(), Range: '0-4999' } },
  );
  if (!resp.ok) throw new Error(`indicadores (valores) respondeu ${resp.status}`);

  const linhas = await resp.json() as Array<Record<string, unknown>>;
  const mapa = new Map<number, number>();
  for (const l of linhas) {
    const valor = Number(l[COLUNA]);
    // Zero entra na media (a unidade operou e nao teve experimental), mas nulo
    // nao: e ausencia de medicao, e trata-la como zero rebaixaria a unidade.
    if (Number.isFinite(valor)) mapa.set(Number(l.unit_id), valor);
  }
  return mapa;
}

async function nomesDasUnidades(): Promise<Map<number, string>> {
  const resp = await fetch(`${INDICADORES_URL}/rest/v1/units?select=id,name`, {
    headers: { ...cabecalhoIndicadores(), Range: '0-4999' },
  });
  if (!resp.ok) throw new Error(`indicadores (units) respondeu ${resp.status}`);
  const linhas = await resp.json() as Array<{ id: number; name: string }>;
  return new Map(linhas.map((u) => [u.id, u.name]));
}

Deno.serve(async (req) => {
  const segredo = segredoEsperado();
  if (!segredo || req.headers.get('authorization') !== `Bearer ${segredo}`) {
    return json({ error: 'unauthorized' }, 401);
  }

  const hoje = hojeEmSaoPaulo();

  // A guarda do dia vem ANTES de qualquer consulta: nos outros ~29 dias do mes
  // a invocacao termina aqui, sem tocar em banco nenhum.
  if (!ehPenultimoDia(hoje)) {
    return json({ ok: true, data: hoje, enviado: false, motivo: 'nao_e_o_penultimo_dia' });
  }

  if (!INDICADORES_ANON) {
    console.error('[relatorio-experimentais] INDICADORES_SUPABASE_ANON_KEY nao configurada.');
    return json({ error: 'indicadores_anon_ausente' }, 500);
  }

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  try {
    const { data: recipientsData, error: erroRecipients } = await sb
      .from('experimentais_relatorio_recipients').select('email')
      .eq('ativo', true).order('email', { ascending: true });
    if (erroRecipients) throw erroRecipients;

    const destinatarios = (recipientsData ?? []).map((r) => r.email as string);
    if (destinatarios.length === 0) {
      console.log(`[relatorio-experimentais] ${hoje}: nenhum destinatario ativo. Nada enviado.`);
      return json({ ok: true, data: hoje, destinatarios: 0, enviado: false });
    }

    const webhookToken = Deno.env.get('INAUGURACAO_WEBHOOK_TOKEN') || '';
    if (!webhookToken) {
      console.error(`[relatorio-experimentais] ${hoje}: INAUGURACAO_WEBHOOK_TOKEN nao configurado.`);
      return json({ error: 'webhook_token_ausente', data: hoje }, 500);
    }

    const meses = janelaDeTresMeses(hoje.slice(0, 7));
    const porMes = await Promise.all(meses.map(valoresDoMes));
    const nomes = await nomesDasUnidades();

    // Media sobre os meses COM dado, e nao sempre sobre 3: uma unidade que
    // abriu no meio do periodo seria rebaixada por dividir por 3.
    const acumulado = new Map<number, { soma: number; meses: number }>();
    for (const mes of porMes) {
      for (const [unitId, valor] of mes) {
        const atual = acumulado.get(unitId) ?? { soma: 0, meses: 0 };
        atual.soma += valor;
        atual.meses += 1;
        acumulado.set(unitId, atual);
      }
    }

    const linhas: LinhaDoRelatorio[] = [];
    for (const [unitId, { soma, meses: qtd }] of acumulado) {
      const media = Math.round((soma / qtd) * 10) / 10;
      linhas.push({
        unitId,
        nome: nomes.get(unitId) ?? `Unidade ${unitId}`,
        media,
        mesesComDado: qtd,
      });
    }
    linhas.sort((a, b) => b.media - a.media || a.nome.localeCompare(b.nome, 'pt-BR'));

    if (linhas.length === 0) {
      console.error(`[relatorio-experimentais] ${hoje}: nenhuma unidade com dado. Nada enviado.`);
      return json({ error: 'sem_dados_no_periodo', data: hoje }, 500);
    }

    const { assunto, corpo } = montarEmailExperimentais(meses, linhas);

    const resp = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', [WEBHOOK_HEADER]: webhookToken },
      body: JSON.stringify({ destinatarios, assunto, corpo }),
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
    });

    if (!resp.ok) {
      const texto = await resp.text();
      console.error(`[relatorio-experimentais] ${hoje}: n8n respondeu ${resp.status}: ${texto.slice(0, 300)}`);
      return json({ error: 'falha_no_webhook_n8n', data: hoje, detalhe: texto.slice(0, 300) }, 502);
    }

    console.log(`[relatorio-experimentais] ${hoje}: enviado para ${destinatarios.length} destinatario(s). ${linhas.length} unidades, meses ${meses.join(', ')}.`);
    return json({
      ok: true, data: hoje, meses,
      destinatarios: destinatarios.length,
      unidades: linhas.length,
      enviado: true,
    });
  } catch (e) {
    console.error(`[relatorio-experimentais] erro inesperado: ${String(e)}`);
    return json({ error: String(e) }, 500);
  }
});
