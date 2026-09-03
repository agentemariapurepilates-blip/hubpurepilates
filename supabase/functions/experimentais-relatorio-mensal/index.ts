// Relatorio de AULAS EXPERIMENTAIS. Lista as unidades com a media dos 3
// ultimos meses (o vigente e os dois anteriores), divididas em BOM (30 ou
// mais), REGULAR (20 a 29) e RUIM (ate 19) -- faixas FIXAS, que nao dependem
// de como as outras unidades foram no periodo (ver BLOCOS em email.ts). Se a
// rede inteira melhorar, todas podem chegar a "Bom".
//
// TRES CHAMADORES, com poderes diferentes (ver _shared/modo-relatorio.ts):
//   cron   -- pg_cron, no penultimo dia do mes as 03:00 de Sao Paulo. Autoriza
//             pelo segredo. Monta e envia para a lista inteira.
//   previa -- o admin, na subaba Clusters da Administracao. Autoriza pelo JWT.
//             Monta e DEVOLVE o e-mail; nao envia nada, e nao espera o dia.
//   teste  -- o mesmo admin. Envia so para o e-mail dele.
//
// NAO PUBLICADA AINDA, a pedido do usuario. Enquanto nao for, a lista de
// destinatarios no Hub continua funcionando (ela le o banco direto), mas a
// previa e o teste mostram erro: os dois dependem desta function no ar.
//
// POR QUE O AGENDAMENTO E DIARIO e a decisao fica aqui:
// o pedido e "penultimo dia do mes", que varia entre 27 e 30 conforme o mes e o
// ano bissexto. O cron nao sabe expressar isso -- '0 6 28-30 * *' dispararia
// varias vezes em alguns meses e no dia errado em fevereiro. Entao o pg_cron
// chama TODO DIA as 06:00 UTC (03:00 de Sao Paulo) e a function sai logo no
// comeco se nao for o dia certo. Sair cedo custa uma invocacao vazia por dia,
// que e barato perto de mandar o relatorio no dia errado.

import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  COLUNA_EXPERIMENTAIS,
  hojeEmSaoPaulo,
  janelaDeTresMeses,
  mediaPorUnidade,
  montarEmailExperimentais,
} from './email.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import { adminDoHub, type AdminIdentificado } from '../_shared/admin-do-hub.ts';
import {
  destinatariosDoModo,
  ehSegredoDoCron,
  exigeAdmin,
  modoDaRequisicao,
} from '../_shared/modo-relatorio.ts';

const N8N_WEBHOOK_URL = Deno.env.get('EXPERIMENTAIS_WEBHOOK_URL')
  || 'https://backend.purepilates.com.br/webhook/relatorio-experimentais';

const WEBHOOK_TIMEOUT_MS = 60_000;
const WEBHOOK_HEADER = 'x-inauguracao-token';

const INDICADORES_URL = Deno.env.get('INDICADORES_SUPABASE_URL')
  || 'https://bweyyihedqnckbtzbkie.supabase.co';
// Sem segredo: esta chave ja e distribuida no bundle do frontend, entao
// mante-la aqui nao expoe nada novo. A variavel de ambiente continua tendo
// prioridade, para o dia em que o projeto rotacionar a chave.
const INDICADORES_ANON = Deno.env.get('INDICADORES_SUPABASE_ANON_KEY')
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3ZXl5aWhlZHFuY2tidHpia2llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNzI3NjIsImV4cCI6MjA4MDk0ODc2Mn0.y87s13__DraHC-1ANCMknr1Uo4-TZzdr1tov2phr9rI';

function segredoEsperado(): string {
  return Deno.env.get('INAUGURACAO_CRON_SECRET') || Deno.env.get('INSTAGRAM_CRON_SECRET') || '';
}

function penultimoDiaDoMes(ano: number, mes: number): string {
  const ultimo = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  return `${ano}-${String(mes).padStart(2, '0')}-${String(ultimo - 1).padStart(2, '0')}`;
}

function ehPenultimoDia(data: string): boolean {
  const [ano, mes] = data.split('-').map(Number);
  return data === penultimoDiaDoMes(ano, mes);
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
    `${base}?select=unit_id,${COLUNA_EXPERIMENTAIS}&date=eq.${dias[0].date}`,
    { headers: { ...cabecalhoIndicadores(), Range: '0-4999' } },
  );
  if (!resp.ok) throw new Error(`indicadores (valores) respondeu ${resp.status}`);

  const linhas = await resp.json() as Array<Record<string, unknown>>;
  const mapa = new Map<number, number>();
  for (const l of linhas) {
    const valor = Number(l[COLUNA_EXPERIMENTAIS]);
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
  const corsHeaders = getCorsHeaders(req);
  // A prévia e o teste partem do navegador, então a function passa a atender
  // preflight. O cron não manda OPTIONS e não nota diferença.
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  // O pg_cron manda {} ; o Hub manda {"modo":"previa"} ou {"modo":"teste"}.
  const pedido = await req.json().catch(() => ({}));
  const modo = modoDaRequisicao(pedido);
  if (!modo) return json({ error: 'modo_desconhecido' }, 400);

  const authorization = req.headers.get('authorization');
  let admin: AdminIdentificado | null = null;

  if (exigeAdmin(modo)) {
    // Prévia e teste são autorizados pelo JWT de admin, NUNCA pelo segredo do
    // cron: esse segredo não existe no navegador, e aceitar os dois caminhos
    // aqui seria a única forma de ele um dia precisar existir lá.
    admin = await adminDoHub(authorization);
    if (!admin) return json({ error: 'unauthorized' }, 401);
  } else if (!ehSegredoDoCron(authorization, segredoEsperado())) {
    return json({ error: 'unauthorized' }, 401);
  }

  const hoje = hojeEmSaoPaulo();

  // Disparo manual: `{"forcar": true}` no corpo pula a guarda do dia.
  //
  // POR QUE EXISTE: sem isto, a unica forma de conferir que esta cadeia
  // funciona seria esperar o penultimo dia do mes -- e descobrir um problema
  // justamente no dia em que o relatorio deveria sair. Com o disparo manual da
  // para validar quando quiser.
  //
  // NAO E UMA PORTA ABERTA: a requisicao ja passou pela checagem do Bearer
  // acima, entao so quem tem o segredo do cron chega aqui. O pg_cron manda
  // `{}`, e nunca aciona isto sozinho.
  const forcar = (pedido as { forcar?: unknown })?.forcar === true;

  // A guarda do dia vem ANTES de qualquer consulta: nos outros ~29 dias do mes
  // a invocacao termina aqui, sem tocar em banco nenhum.
  //
  // Ela vale so para o cron. Previa e teste sao pedidos de alguem olhando a
  // tela, e recusa-los porque hoje nao e o penultimo dia do mes tornaria a
  // previa inutil em 29 dos 30 dias -- justamente o problema que ela resolve.
  if (modo === 'cron' && !forcar && !ehPenultimoDia(hoje)) {
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

    const lista = (recipientsData ?? []).map((r) => r.email as string);
    const destinatarios = destinatariosDoModo(modo, {
      lista,
      emailDoAdmin: admin?.email ?? null,
    });

    if (modo === 'cron' && destinatarios.length === 0) {
      console.log(`[relatorio-experimentais] ${hoje}: nenhum destinatario ativo. Nada enviado.`);
      return json({ ok: true, data: hoje, destinatarios: 0, enviado: false });
    }

    // Um admin sem e-mail no cadastro nao tem para onde receber o teste. Cair
    // na lista aqui transformaria um dado faltando num envio para a rede.
    if (modo === 'teste' && destinatarios.length === 0) {
      return json({ error: 'admin_sem_email' }, 400);
    }

    // A previa nao envia, entao nao precisa do token.
    const webhookToken = modo === 'previa' ? '' : (Deno.env.get('INAUGURACAO_WEBHOOK_TOKEN') || '');
    if (modo !== 'previa' && !webhookToken) {
      console.error(`[relatorio-experimentais] ${hoje}: INAUGURACAO_WEBHOOK_TOKEN nao configurado.`);
      return json({ error: 'webhook_token_ausente', data: hoje }, 500);
    }

    const meses = janelaDeTresMeses(hoje.slice(0, 7));
    const porMes = await Promise.all(meses.map(valoresDoMes));
    const nomes = await nomesDasUnidades();

    // O calculo vive em email.ts porque a previa da tela o refaz NO NAVEGADOR,
    // e uma media diferente ali produziria uma previa mentirosa.
    const linhas = mediaPorUnidade(porMes, nomes);

    if (linhas.length === 0) {
      console.error(`[relatorio-experimentais] ${hoje}: nenhuma unidade com dado. Nada enviado.`);
      return json({ error: 'sem_dados_no_periodo', data: hoje }, 500);
    }

    const { assunto, corpo } = montarEmailExperimentais(meses, linhas);

    // A previa para exatamente aqui: o par que ela devolve e o MESMO que o
    // envio mandaria -- e por isso que ela vale como conferencia.
    if (modo === 'previa') {
      return json({
        assunto, corpo,
        meses,
        unidades: linhas.length,
        destinatariosAtivos: lista.length,
      });
    }

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
      ok: true, data: hoje, meses, modo,
      destinatarios: destinatarios.length,
      unidades: linhas.length,
      enviado: true,
    });
  } catch (e) {
    console.error(`[relatorio-experimentais] erro inesperado: ${String(e)}`);
    return json({ error: String(e) }, 500);
  }
});
