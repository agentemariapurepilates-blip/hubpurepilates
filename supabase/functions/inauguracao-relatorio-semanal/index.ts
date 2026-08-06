// Cron: relatorio semanal de inauguracoes para quem esta em
// inauguracao_relatorio_recipients. Disparada por pg_cron toda segunda as 07:00
// de Sao Paulo (10:00 UTC). Autentica via Bearer, igual a function do aviso
// diario.
//
// NAO PUBLICADA AINDA. Escrita a pedido do usuario para ficar pronta; o deploy,
// o agendamento e a importacao do workflow acontecem quando ele autorizar.
//
// DIFERENCA PARA O AVISO DIARIO, e o motivo de ser outra function:
// o aviso diario manda UM e-mail POR UNIDADE (cada um e uma tarefa distinta
// para o marketing) e marca cada linha como avisada. O relatorio manda UM
// e-mail SO, com todas as unidades das duas semanas, e nao marca nada -- e
// informativo, nao operacional. Reaproveitar a mesma function exigiria dois
// modos dentro dela e dois formatos de resposta do n8n.
//
// POR QUE O HTML E MONTADO AQUI, e nao no n8n:
// o corpo tem duas listas de tamanho variavel. Montar isso com expressoes do
// n8n vira um no de codigo ilegivel; aqui e um laco. O n8n fica sendo so o
// carteiro, que e o mesmo papel que ele tem no aviso diario.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { janelas, montarEmail } from './email.ts';

const N8N_WEBHOOK_URL = Deno.env.get('RELATORIO_WEBHOOK_URL')
  || 'https://backend.purepilates.com.br/webhook/relatorio-inauguracoes';

const WEBHOOK_TIMEOUT_MS = 60_000;

// Mesmo header e mesmo segredo do aviso diario: a fronteira de confianca e a
// mesma (Supabase -> n8n), e um segredo por rota so multiplicaria o que ha para
// rotacionar sem reduzir o alcance de um vazamento.
const WEBHOOK_HEADER = 'x-inauguracao-token';

interface InauguracaoRow {
  id: string;
  nome_unidade: string;
  unidade_id: string;
  endereco: string;
  solicitante_nome: string;
  solicitante_email: string;
  data_inauguracao: string;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Ver o comentario extenso em inauguracao-aviso-diario/index.ts: o pg_cron so
// le segredo do Vault, e `instagram_cron_secret` e o unico que existe nos dois
// lados. E um compromisso herdado, nao um desenho.
function segredoEsperado(): string {
  return Deno.env.get('INAUGURACAO_CRON_SECRET')
    || Deno.env.get('INSTAGRAM_CRON_SECRET')
    || '';
}

/** Data de hoje em Sao Paulo, YYYY-MM-DD — o formato da coluna `date`. */
function hojeEmSaoPaulo(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
}

Deno.serve(async (req) => {
  const segredo = segredoEsperado();
  if (!segredo || req.headers.get('authorization') !== `Bearer ${segredo}`) {
    return json({ error: 'unauthorized' }, 401);
  }

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  try {
    const hoje = hojeEmSaoPaulo();
    // Duas janelas de 7 dias que se encostam sem sobrepor: [hoje-7, hoje-1] e
    // [hoje, hoje+6]. Rodando na segunda, a primeira e a semana anterior
    // inteira e a segunda e a semana que comeca hoje.
    const { inicioPassada, fimPassada, fimProxima } = janelas(hoje);

    const colunas = 'id, nome_unidade, unidade_id, endereco, solicitante_nome, solicitante_email, data_inauguracao';

    const { data: passadasData, error: erroPassadas } = await sb
      .from('inauguracao_requests').select(colunas)
      .gte('data_inauguracao', inicioPassada).lte('data_inauguracao', fimPassada)
      .order('data_inauguracao', { ascending: true });
    if (erroPassadas) throw erroPassadas;

    const { data: proximasData, error: erroProximas } = await sb
      .from('inauguracao_requests').select(colunas)
      .gte('data_inauguracao', hoje).lte('data_inauguracao', fimProxima)
      .order('data_inauguracao', { ascending: true });
    if (erroProximas) throw erroProximas;

    const passadas = (passadasData ?? []) as InauguracaoRow[];
    const proximas = (proximasData ?? []) as InauguracaoRow[];

    const { data: recipientsData, error: erroRecipients } = await sb
      .from('inauguracao_relatorio_recipients').select('email')
      .eq('ativo', true).order('email', { ascending: true });
    if (erroRecipients) throw erroRecipients;

    const destinatarios = (recipientsData ?? []).map((r) => r.email as string);

    // Sem ninguem na lista nao ha o que fazer, e isso NAO e erro: a lista pode
    // estar sendo montada ainda. Diferente do aviso diario, aqui nao existe
    // "oportunidade perdida" -- o relatorio da semana que vem tera os mesmos
    // dados mais uma semana.
    if (destinatarios.length === 0) {
      console.log(`[relatorio-semanal] ${hoje}: nenhum destinatario ativo. Nada enviado.`);
      return json({ ok: true, data: hoje, destinatarios: 0, passadas: passadas.length, proximas: proximas.length, enviado: false });
    }

    const webhookToken = Deno.env.get('INAUGURACAO_WEBHOOK_TOKEN') || '';
    if (!webhookToken) {
      console.error(`[relatorio-semanal] ${hoje}: INAUGURACAO_WEBHOOK_TOKEN nao configurado. Nada enviado.`);
      return json({ error: 'webhook_token_ausente', data: hoje }, 500);
    }

    const { assunto, corpo } = montarEmail(passadas, proximas, hoje);

    const resp = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', [WEBHOOK_HEADER]: webhookToken },
      body: JSON.stringify({ destinatarios, assunto, corpo }),
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
    });

    if (!resp.ok) {
      const texto = await resp.text();
      console.error(`[relatorio-semanal] ${hoje}: n8n respondeu ${resp.status}: ${texto.slice(0, 300)}`);
      return json({ error: 'falha_no_webhook_n8n', data: hoje, detalhe: texto.slice(0, 300) }, 502);
    }

    console.log(`[relatorio-semanal] ${hoje}: enviado para ${destinatarios.length} destinatario(s). ${passadas.length} na semana passada, ${proximas.length} na proxima.`);
    return json({
      ok: true, data: hoje,
      destinatarios: destinatarios.length,
      passadas: passadas.length,
      proximas: proximas.length,
      enviado: true,
    });
  } catch (e) {
    console.error(`[relatorio-semanal] erro inesperado: ${String(e)}`);
    return json({ error: String(e) }, 500);
  }
});
