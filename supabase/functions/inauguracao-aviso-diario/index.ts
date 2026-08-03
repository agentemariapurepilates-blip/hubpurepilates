// Cron: avisa o marketing das unidades que inauguram HOJE.
// Disparada por pg_cron as 03:00 de Sao Paulo. Autentica via Bearer ${CRON_SECRET},
// igual as outras functions de cron deste projeto (dpp-cron-sync-units e cia).
//
// POR QUE ESTA FUNCTION EXISTE (a inversao da arquitetura):
// A primeira versao deixava o proprio workflow do n8n ler o Supabase, via
// PostgREST, com {{ $env.SUPABASE_URL }} e {{ $env.SUPABASE_SERVICE_ROLE_KEY }}.
// Essas variaveis NAO existem na instancia do n8n e a execucao real quebrou com
// "Invalid URL: /rest/v1/... URL must start with http or https" -- a expressao
// resolveu para string vazia e a URL virou um caminho relativo. Colocar a chave
// de servico dentro do n8n foi descartado: ela ignora toda a RLS do banco.
//
// Entao o fluxo foi invertido. Quem le o banco e quem marca as linhas e ESTA
// function, que ja roda dentro do Supabase e ja tem a chave de servico no
// ambiente. O n8n virou so o carteiro: recebe a lista pronta por webhook, manda
// os e-mails pelo Gmail e devolve os ids que conseguiu enviar. NENHUM segredo do
// Supabase entra no n8n.

import { createClient } from 'npm:@supabase/supabase-js@2';

// URL do webhook do n8n. O default e o mesmo host dos outros webhooks da
// instancia (ver send-midia-adicional), para a function funcionar mesmo se o
// segredo nao tiver sido cadastrado ainda.
const N8N_WEBHOOK_URL = Deno.env.get('INAUGURACAO_WEBHOOK_URL')
  || 'https://backend.purepilates.com.br/webhook/aviso-inauguracao';

// Teto de espera pelo n8n. Existe porque o workflow responde por "Respond to
// Webhook": se o no de resposta nao for alcancado, a requisicao ficaria pendurada
// ate o timeout da plataforma. Estourar aqui NAO marca nada -- ver o final.
const WEBHOOK_TIMEOUT_MS = 60_000;

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

Deno.serve(async (req) => {
  const expected = `Bearer ${Deno.env.get('CRON_SECRET') ?? ''}`;
  if (req.headers.get('authorization') !== expected) {
    return json({ error: 'unauthorized' }, 401);
  }

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  try {
    // HOJE EM SAO PAULO, nao em UTC. Rodando as 03:00 locais o dia em UTC ja
    // virou (06:00 UTC do mesmo dia, mas em outros horarios de disparo a
    // diferenca troca a data), e um dia errado aqui significa avisar a
    // inauguracao errada -- ou nenhuma. 'en-CA' e o truque padrao para obter
    // YYYY-MM-DD, que e exatamente o formato da coluna `date` do Postgres.
    const hoje = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
    }).format(new Date());

    // As duas leituras usam a chave de servico e passam por cima da RLS de
    // proposito: inauguracao_requests so mostra as linhas do proprio
    // colaborador, e inauguracao_email_recipients so e visivel para admin.
    const { data: inauguracoesData, error: inauguracoesErr } = await sb
      .from('inauguracao_requests')
      .select('id, nome_unidade, unidade_id, endereco, solicitante_nome, solicitante_email, data_inauguracao')
      .eq('data_inauguracao', hoje)
      .is('email_enviado_em', null);
    if (inauguracoesErr) throw inauguracoesErr;

    const inauguracoes = (inauguracoesData ?? []) as InauguracaoRow[];

    // Nenhuma unidade inaugura hoje: e o dia normal, nao um erro. Sai antes de
    // ler os destinatarios -- sem inauguracao, lista vazia nao e problema de
    // ninguem.
    if (inauguracoes.length === 0) {
      console.log(`[aviso-inauguracao] ${hoje}: nenhuma inauguracao pendente de aviso.`);
      return json({
        ok: true,
        data: hoje,
        inauguracoes: 0,
        destinatarios: 0,
        marcadas: 0,
        mensagem: 'Nenhuma inauguracao hoje. Nada a enviar.',
      });
    }

    const { data: recipientsData, error: recipientsErr } = await sb
      .from('inauguracao_email_recipients')
      .select('email')
      .eq('ativo', true)
      .order('email', { ascending: true });
    if (recipientsErr) throw recipientsErr;

    const destinatarios = (recipientsData ?? []).map((r) => r.email as string);

    // HA INAUGURACAO E NAO HA PARA QUEM MANDAR. Este e o unico caso que nao pode
    // passar em silencio: a consulta e sempre "hoje", entao um aviso que nao sai
    // hoje nao sai nunca. Falha ruidosa (500 no log do cron) e NADA e marcado --
    // se alguem reativar um destinatario ainda hoje e reexecutar, o aviso sai.
    if (destinatarios.length === 0) {
      console.error(
        `[aviso-inauguracao] ${hoje}: ${inauguracoes.length} inauguracao(oes) hoje e NENHUM destinatario ativo em inauguracao_email_recipients. Nada foi enviado e nada foi marcado. Cadastre/ative alguem no Hub (Inauguracoes -> Destinatarios) e reexecute AINDA HOJE -- amanha esta consulta nao devolve mais estas linhas.`,
      );
      return json({
        error: 'sem_destinatarios_ativos',
        data: hoje,
        inauguracoes: inauguracoes.length,
        destinatarios: 0,
        marcadas: 0,
        mensagem: 'Ha inauguracao hoje mas nenhum destinatario ativo. Nada enviado, nada marcado.',
      }, 500);
    }

    // A data ja vai formatada para o n8n. Formatar aqui evita depender do ICU do
    // Node da instancia do n8n (a versao anterior usava Luxon com locale pt-BR e
    // o mes podia sair em ingles).
    const payload = {
      destinatarios,
      inauguracoes: inauguracoes.map((i) => ({
        id: i.id,
        nome_unidade: i.nome_unidade,
        unidade_id: i.unidade_id,
        endereco: i.endereco,
        solicitante_nome: i.solicitante_nome,
        solicitante_email: i.solicitante_email,
        data_inauguracao: i.data_inauguracao,
        data_inauguracao_fmt: i.data_inauguracao.split('-').reverse().join('/'),
      })),
    };

    let enviados: string[];
    try {
      const resp = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`n8n respondeu ${resp.status}: ${errText.slice(0, 500)}`);
      }

      const parsed = await resp.json();

      // O contrato e { "enviados": ["id", ...] }. Array puro tambem e aceito
      // porque e o formato que sai de um "Respond to Webhook" configurado em
      // "All Incoming Items" -- e a troca mais provavel de acontecer no n8n.
      const bruto = Array.isArray(parsed) ? parsed : parsed?.enviados;
      if (!Array.isArray(bruto)) {
        throw new Error(`resposta do n8n em formato inesperado: ${JSON.stringify(parsed).slice(0, 500)}`);
      }

      // So aceita ids que estavam neste lote. Protege contra o n8n devolver
      // qualquer outra coisa (itens do proprio Gmail, por exemplo) e essa coisa
      // virar um UPDATE em linha que ninguem mandou avisar.
      const idsDoLote = new Set(inauguracoes.map((i) => i.id));
      enviados = bruto.filter((id: unknown): id is string => typeof id === 'string' && idsDoLote.has(id));
    } catch (e) {
      // NAO MARCA NADA. O n8n pode ter enviado ou nao -- nao da para saber. Entre
      // marcar sem ter certeza (aviso perdido para sempre, em silencio) e nao
      // marcar (risco de e-mail repetido numa reexecucao), o desenho escolhe o
      // repetido. Este log e barulhento de proposito: como a consulta e sempre
      // "hoje", ninguem descobre depois que este aviso falhou.
      console.error(
        `[aviso-inauguracao] ${hoje}: FALHA ao falar com o n8n (${N8N_WEBHOOK_URL}). ${inauguracoes.length} inauguracao(oes) NAO foram marcadas e o aviso pode nao ter saido. Erro: ${String(e)}`,
      );
      return json({
        error: 'falha_no_webhook_n8n',
        data: hoje,
        inauguracoes: inauguracoes.length,
        destinatarios: destinatarios.length,
        marcadas: 0,
        detalhe: String(e),
      }, 502);
    }

    // Marca SO o que o n8n confirmou. Lista vazia (todos os envios falharam, ou o
    // no de e-mail estourou antes do laco) tambem nao marca nada, e continua
    // sendo um caso ruidoso.
    let marcadas = 0;
    if (enviados.length > 0) {
      const { error: updateErr } = await sb
        .from('inauguracao_requests')
        .update({ email_enviado_em: new Date().toISOString() })
        .in('id', enviados);
      if (updateErr) throw updateErr;
      marcadas = enviados.length;
    }

    const naoEnviadas = inauguracoes.length - marcadas;
    if (naoEnviadas > 0) {
      console.error(
        `[aviso-inauguracao] ${hoje}: o n8n confirmou ${marcadas} de ${inauguracoes.length} inauguracao(oes). ${naoEnviadas} continuam sem aviso e sem marcacao -- reexecute AINDA HOJE se quiser recuperar.`,
      );
    } else {
      console.log(`[aviso-inauguracao] ${hoje}: ${marcadas} aviso(s) enviado(s) para ${destinatarios.length} destinatario(s).`);
    }

    return json({
      ok: true,
      data: hoje,
      inauguracoes: inauguracoes.length,
      destinatarios: destinatarios.length,
      marcadas,
    });
  } catch (e) {
    console.error(`[aviso-inauguracao] erro inesperado: ${String(e)}`);
    return json({ error: String(e) }, 500);
  }
});
