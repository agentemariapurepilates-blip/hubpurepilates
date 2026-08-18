// Traz os leads dos formulários de RH do Meta para a tabela `rh_leads`.
//
// NÃO PUBLICADA. Modo local. Para publicar:
//   supabase secrets set META_PAGE_TOKENS='{"112957998781868":"EAA..."}' --project-ref evprrtvbvjnjixogjsmn
//   supabase functions deploy rh-leads-sync --project-ref evprrtvbvjnjixogjsmn
//
// ────────────────────────────────────────────────────────────────────────────
// O QUE A CONTA DE VERDADE ENSINOU (18/08/2026)
// ────────────────────────────────────────────────────────────────────────────
//
// 1. `/{adset_id}/leads` NÃO EXISTE. A Graph API responde "(#100) Tried
//    accessing nonexisting field (leads)". Os caminhos que existem são
//    `/{form_id}/leads` e `/{ad_id}/leads`.
//
// 2. Vale muito mais ir pelo FORMULÁRIO. Pelo anúncio seriam 33 conjuntos ×
//    N anúncios de requisições — e a varredura estourou o limite da API na
//    primeira tentativa ("User request limit reached"). Pelo formulário são
//    duas chamadas, e ainda vêm os leads de anúncios já apagados.
//
// 3. `/{form_id}/leads` EXIGE PAGE ACCESS TOKEN. Com o token de usuário a
//    resposta vem `{"data":[]}` — sem erro, sem aviso, apenas vazia. É o pior
//    tipo de falha, porque parece "não há leads".
//
// 4. Cada lead traz `adset_name`, que é de onde sai a separação por unidade.
//    Só é preciso PEDIR o campo: sem `fields=`, a API devolve o lead sem
//    nenhuma referência ao conjunto.

import { getCorsHeaders } from '../_shared/cors.ts';

const V = 'v21.0';

/** Os campos que interessam. Sem pedir, `adset_name` não vem. */
const CAMPOS = [
  'id',
  'created_time',
  'ad_id',
  'ad_name',
  'adset_id',
  'adset_name',
  'campaign_id',
  'campaign_name',
  'form_id',
  'platform',
  'is_organic',
  'field_data',
].join(',');

/** Quais formulários são de RH. */
const EH_FORMULARIO_DE_RH = /rh|cargo|instrutor|recrut|vaga|curr/i;

const MARCA_DE_TESTE = /<test lead/i;

interface Campo {
  name: string;
  values: string[];
}

const CONHECIDOS = {
  nome: ['full_name', 'nome', 'nome_completo', 'first_name'],
  email: ['email', 'e-mail'],
  telefone: ['phone_number', 'telefone', 'celular', 'whatsapp'],
  unidade: ['selecione_a_unidade', 'unidade', 'qual_unidade'],
};

const chave = (t: string) =>
  t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

function valorDe(campos: Campo[], nomes: string[]): string | null {
  const procurados = nomes.map(chave);
  const achado = campos.find((c) => procurados.includes(chave(c.name)));
  const valor = achado?.values?.[0]?.trim();
  return valor ? valor : null;
}

async function paginado(url: string): Promise<Record<string, unknown>[]> {
  const itens: Record<string, unknown>[] = [];
  let atual: string | null = url;

  while (atual) {
    const resposta = await fetch(atual);
    const corpo = await resposta.json();
    if (corpo.error) throw new Error(corpo.error.message);
    itens.push(...(corpo.data ?? []));
    atual = corpo.paging?.next ?? null;
  }

  return itens;
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const json = (corpo: unknown, status = 200) =>
    new Response(JSON.stringify(corpo), {
      status,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });

  try {
    // Só o cron, com o segredo. A função grava com a service role, então uma
    // porta aberta aqui seria uma porta aberta na tabela.
    const segredo = Deno.env.get('CRON_SECRET');
    const enviado = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!segredo || enviado !== segredo) return json({ erro: 'não autorizado' }, 401);

    // Um token por página: `/{form_id}/leads` recusa o token de usuário.
    const tokens: Record<string, string> = JSON.parse(
      Deno.env.get('META_PAGE_TOKENS') ?? '{}',
    );
    if (Object.keys(tokens).length === 0) {
      return json({ erro: 'META_PAGE_TOKENS não configurado' }, 500);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRole) return json({ erro: 'ambiente incompleto' }, 500);

    const relatorio: Array<Record<string, unknown>> = [];
    const paraGravar: Array<Record<string, unknown>> = [];

    for (const [paginaId, token] of Object.entries(tokens)) {
      const forms = await paginado(
        `https://graph.facebook.com/${V}/${paginaId}/leadgen_forms` +
          `?fields=id,name,status,leads_count&limit=100&access_token=${token}`,
      );

      const deRh = forms.filter((f) => EH_FORMULARIO_DE_RH.test(String(f.name ?? '')));

      for (const form of deRh) {
        const leads = await paginado(
          `https://graph.facebook.com/${V}/${form.id}/leads` +
            `?fields=${CAMPOS}&limit=100&access_token=${token}`,
        );

        relatorio.push({
          pagina: paginaId,
          form_id: form.id,
          form_name: form.name,
          // Quando `contados` e `trazidos` divergem, o motivo quase sempre é
          // acesso a leads não liberado para o app na Página — e não ausência
          // de leads. Relatar os dois números deixa isso visível.
          contados: form.leads_count ?? 0,
          trazidos: leads.length,
        });

        for (const lead of leads) {
          const campos = (lead.field_data ?? []) as Campo[];
          paraGravar.push({
            id: String(lead.id),
            criado_em: lead.created_time,
            ad_id: lead.ad_id ?? null,
            ad_name: lead.ad_name ?? null,
            adset_id: lead.adset_id ?? null,
            adset_name: lead.adset_name ?? null,
            campaign_id: lead.campaign_id ?? null,
            campaign_name: lead.campaign_name ?? null,
            form_id: String(form.id),
            form_name: String(form.name ?? ''),
            platform: lead.platform ?? null,
            is_organic: Boolean(lead.is_organic),
            nome: valorDe(campos, CONHECIDOS.nome),
            email: valorDe(campos, CONHECIDOS.email),
            telefone: valorDe(campos, CONHECIDOS.telefone)?.replace(/\s+/g, '') ?? null,
            unidade_escolhida: valorDe(campos, CONHECIDOS.unidade),
            field_data: campos,
            eh_teste: campos.some((c) => (c.values ?? []).some((v) => MARCA_DE_TESTE.test(v))),
            sincronizado_em: new Date().toISOString(),
          });
        }
      }
    }

    let gravados = 0;
    if (paraGravar.length > 0) {
      // `merge-duplicates` na chave do Meta: rodar de novo o mesmo período
      // atualiza em vez de duplicar.
      const resposta = await fetch(`${supabaseUrl}/rest/v1/rh_leads?on_conflict=id`, {
        method: 'POST',
        headers: {
          apikey: serviceRole,
          Authorization: `Bearer ${serviceRole}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify(paraGravar),
      });
      if (!resposta.ok) {
        return json({ erro: 'falha ao gravar', detalhe: (await resposta.text()).slice(0, 500) }, 502);
      }
      gravados = paraGravar.length;
    }

    return json({ ok: true, gravados, formularios: relatorio });
  } catch (e) {
    return json({ erro: e instanceof Error ? e.message : String(e) }, 500);
  }
});
