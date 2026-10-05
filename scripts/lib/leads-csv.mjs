/**
 * Lê uma planilha de leads de RH (CSV) e converte cada linha para o formato que
 * a Graph API do Meta entregaria — o mesmo que a tela e a mescla já esperam.
 *
 * POR QUE EXISTE
 * O Meta só guarda lead por 90 dias. O que passou disso (em 05/10/2026, tudo
 * antes de 07/07) não existe mais lá, e só sobrevive em cópias de fora: a
 * exportação da agência que roda os anúncios, uma planilha, um CRM. Este
 * módulo lê essa cópia.
 *
 * O QUE ELE ASSUME (e o que acontece quando a planilha não bate)
 *  - Colunas com os nomes técnicos do Meta: id, created_time, ad_id, ad_name,
 *    adset_id, adset_name, campaign_id, campaign_name, form_id, form_name,
 *    is_organic, platform. Todo o resto vira resposta do formulário.
 *  - Ids com prefixo de exportação (`l:123`, `ag:9`, `f:6`) perdem o prefixo,
 *    para casar com o id puro da API e a mescla não duplicar.
 *  - Hora sem fuso é de São Paulo (UTC-3), porque é de onde vêm as planilhas.
 *  - Linha que não dá para ler NÃO entra: vai para a lista de rejeitadas com o
 *    motivo. Nada é inventado em silêncio — exceto o id, e só com `gerarId`.
 */

import { createHash } from 'node:crypto';

// ── leitura do arquivo ──────────────────────────────────────────────────────

/** Bytes → texto, entendendo BOM de UTF-8 e UTF-16 (o Meta usa os dois). */
export function decodificar(buffer) {
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return buffer.subarray(2).toString('utf16le');
  }
  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
    return Buffer.from(buffer.subarray(2)).swap16().toString('utf16le');
  }
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return buffer.subarray(3).toString('utf8');
  }
  return buffer.toString('utf8');
}

/** O separador mais frequente na primeira linha, fora de aspas. */
function descobrirSeparador(texto) {
  const contagem = { ',': 0, ';': 0, '\t': 0 };
  let dentro = false;
  for (const c of texto) {
    if (c === '"') dentro = !dentro;
    else if (!dentro && (c === '\n' || c === '\r')) break;
    else if (!dentro && c in contagem) contagem[c]++;
  }
  return Object.entries(contagem).sort((a, b) => b[1] - a[1])[0][0];
}

/** CSV → matriz de textos. Aspas, aspas escapadas, quebra de linha dentro de campo. */
export function lerCsv(texto) {
  const limpo = texto.replace(/^﻿/, '');
  const sep = descobrirSeparador(limpo);
  const linhas = [];
  let linha = [];
  let campo = '';
  let dentro = false;

  const fecharCampo = () => { linha.push(campo); campo = ''; };
  const fecharLinha = () => {
    fecharCampo();
    if (linha.some((c) => c.trim() !== '')) linhas.push(linha);
    linha = [];
  };

  for (let i = 0; i < limpo.length; i++) {
    const c = limpo[i];
    if (dentro) {
      if (c === '"' && limpo[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') dentro = false;
      else campo += c;
    } else if (c === '"') dentro = true;
    else if (c === sep) fecharCampo();
    else if (c === '\r') { if (limpo[i + 1] === '\n') i++; fecharLinha(); }
    else if (c === '\n') fecharLinha();
    else campo += c;
  }
  if (campo !== '' || linha.length > 0) fecharLinha();
  return linhas;
}

// ── campos ──────────────────────────────────────────────────────────────────

/** `l:123` → `123`. Sem prefixo fica como está; vazio vira nulo. */
export function normalizarId(valor) {
  if (valor === undefined || valor === null) return null;
  const t = String(valor).trim().replace(/^[a-z]{1,3}:/i, '');
  return t === '' ? null : t;
}

const ISO = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?\s*(Z|[+-]\d{2}:?\d{2})?$/i;
const BR = /^(\d{2})\/(\d{2})\/(\d{4})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/;
const SAO_PAULO_EM_MINUTOS = -180;

const dois = (n) => String(n).padStart(2, '0');

/**
 * Qualquer das datas aceitas → `AAAA-MM-DDTHH:MM:SS+0000` (o formato do Meta,
 * em UTC). Devolve nulo se não der para ler ou se a data não existir.
 */
export function paraHoraUtc(valor) {
  const t = String(valor ?? '').trim();
  let a, m, d, h, mi, s, deslocamento;

  const iso = ISO.exec(t);
  const br = iso ? null : BR.exec(t);
  if (iso) {
    [, a, m, d, h, mi, s] = iso;
    const z = iso[7];
    if (!z) deslocamento = SAO_PAULO_EM_MINUTOS;
    else if (z.toUpperCase() === 'Z') deslocamento = 0;
    else {
      const sinal = z[0] === '-' ? -1 : 1;
      const dig = z.slice(1).replace(':', '');
      deslocamento = sinal * (Number(dig.slice(0, 2)) * 60 + Number(dig.slice(2)));
    }
  } else if (br) {
    [, d, m, a, h = '00', mi = '00', s] = br;
    deslocamento = SAO_PAULO_EM_MINUTOS;
  } else return null;

  const [A, M, D, H, MI, S] = [a, m, d, h, mi, s ?? '00'].map(Number);
  const local = new Date(Date.UTC(A, M - 1, D, H, MI, S));
  // A data tem que existir: 31/02 viraria 03/03 em silêncio.
  if (
    local.getUTCFullYear() !== A || local.getUTCMonth() !== M - 1 || local.getUTCDate() !== D ||
    local.getUTCHours() !== H || local.getUTCMinutes() !== MI
  ) return null;

  const utc = new Date(local.getTime() - deslocamento * 60000);
  return (
    `${utc.getUTCFullYear()}-${dois(utc.getUTCMonth() + 1)}-${dois(utc.getUTCDate())}` +
    `T${dois(utc.getUTCHours())}:${dois(utc.getUTCMinutes())}:${dois(utc.getUTCSeconds())}+0000`
  );
}

/** Minúsculas, sem acento, espaço vira `_` — o cabeçalho varia entre exportações. */
function chave(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_');
}

const ALIASES = {
  id: ['id', 'lead_id', 'id_do_lead'],
  created_time: ['created_time', 'data_de_criacao', 'data_criacao', 'criado_em', 'data_e_hora', 'data'],
};
const IDENTIDADE = [
  'ad_id', 'ad_name', 'adset_id', 'adset_name', 'campaign_id', 'campaign_name',
  'form_id', 'form_name', 'is_organic', 'platform',
];
/** Colunas que descrevem o lead no CRM do Meta, não o formulário. */
const METADADOS_IGNORADOS = ['lead_status', 'status_do_lead'];

function booleano(valor) {
  return /^(true|1|sim|yes|s|y)$/i.test(String(valor ?? '').trim());
}

const texto = (v) => {
  const t = String(v ?? '').trim();
  return t === '' ? null : t;
};

/**
 * Uma linha da planilha → lead no formato da Graph API.
 * `{ ok: true, lead, idGerado }` ou `{ ok: false, motivo }`.
 */
export function paraLeadBruto(cabecalho, linha, opcoes = {}) {
  const porChave = {};
  const camposDoFormulario = [];

  cabecalho.forEach((nome, i) => {
    const k = chave(nome);
    const valor = linha[i] ?? '';
    porChave[k] = valor;
    const ehIdentidade =
      IDENTIDADE.includes(k) || ALIASES.id.includes(k) || ALIASES.created_time.includes(k) ||
      METADADOS_IGNORADOS.includes(k);
    if (!ehIdentidade && String(valor).trim() !== '') {
      camposDoFormulario.push({ name: String(nome).trim(), values: [String(valor).trim()] });
    }
  });

  const primeiro = (lista) => lista.map((k) => porChave[k]).find((v) => v !== undefined);

  const bruta = primeiro(ALIASES.created_time);
  const criado = paraHoraUtc(bruta);
  if (!criado) return { ok: false, motivo: `data ilegível ("${String(bruta ?? '').slice(0, 30)}")` };

  let id = normalizarId(primeiro(ALIASES.id));
  let idGerado = false;
  if (!id) {
    if (!opcoes.gerarId) {
      return { ok: false, motivo: 'sem id do Meta (peça a coluna "id" à agência ou use --gerar-id)' };
    }
    const base = criado + '|' + camposDoFormulario.map((c) => c.values.join(',')).join('|');
    id = 'csv-' + createHash('sha256').update(base).digest('hex').slice(0, 16);
    idGerado = true;
  }

  const lead = {
    id,
    created_time: criado,
    ad_id: normalizarId(porChave.ad_id),
    ad_name: texto(porChave.ad_name),
    adset_id: normalizarId(porChave.adset_id),
    adset_name: texto(porChave.adset_name),
    campaign_id: normalizarId(porChave.campaign_id),
    campaign_name: texto(porChave.campaign_name),
    form_id: normalizarId(porChave.form_id),
    form_name: texto(porChave.form_name),
    platform: texto(porChave.platform)?.toLowerCase() ?? null,
    is_organic: booleano(porChave.is_organic),
    field_data: camposDoFormulario,
  };
  return { ok: true, lead, idGerado };
}

/**
 * A planilha inteira. Linhas ruins não derrubam as boas: vão para `rejeitadas`
 * com o número do registro (o cabeçalho é o 1) e o motivo.
 *
 * `apenasAntesDe` (com `gerarId`): ignora as linhas sem id cuja data cai na
 * janela que o Meta ainda entrega. Elas já estão no arquivo com o id de
 * verdade; importar de novo com id inventado duplicaria o lead.
 */
export function importarCsv(textoDoArquivo, opcoes = {}) {
  const linhas = lerCsv(textoDoArquivo);
  if (linhas.length === 0) throw new Error('O arquivo está vazio.');

  const [cabecalho, ...dados] = linhas;
  const chaves = cabecalho.map(chave);
  if (!ALIASES.created_time.some((k) => chaves.includes(k))) {
    throw new Error('Falta a coluna de data (created_time). Colunas encontradas: ' + cabecalho.join(', '));
  }
  if (!opcoes.gerarId && !ALIASES.id.some((k) => chaves.includes(k))) {
    throw new Error('Falta a coluna "id" do lead. Peça-a à agência, ou use --gerar-id.');
  }

  const porId = new Map();
  const rejeitadas = [];
  let repetidos = 0;
  let pulados = 0;

  dados.forEach((linha, i) => {
    const r = paraLeadBruto(cabecalho, linha, opcoes);
    const numero = i + 2;
    if (!r.ok) {
      rejeitadas.push({ linha: numero, motivo: r.motivo });
      return;
    }
    if (r.idGerado && opcoes.apenasAntesDe && r.lead.created_time >= opcoes.apenasAntesDe) {
      pulados++;
      return;
    }
    if (porId.has(r.lead.id)) {
      repetidos++;
      return;
    }
    porId.set(r.lead.id, r.lead);
  });

  const leads = [...porId.values()].sort((a, b) => b.created_time.localeCompare(a.created_time));
  const periodo = leads.length
    ? { de: leads[leads.length - 1].created_time.slice(0, 10), ate: leads[0].created_time.slice(0, 10) }
    : null;

  return { leads, rejeitadas, repetidos, pulados, periodo, lidas: dados.length };
}

// ── tabela do banco ─────────────────────────────────────────────────────────
// Mesmas listas de lib/leads.ts e da função rh-leads-sync. O teste compara o
// resultado com o de normalizarLead para pegar qualquer divergência.

const CONHECIDOS = {
  nome: ['full_name', 'nome', 'nome_completo', 'first_name'],
  email: ['email', 'e-mail'],
  telefone: ['phone_number', 'telefone', 'celular', 'whatsapp'],
  unidade: ['selecione_a_unidade', 'unidade', 'qual_unidade', 'selecione_a_unidade?'],
};
const MARCA_DE_TESTE = /<test lead/i;

function valorDe(campos, nomes) {
  const procurados = nomes.map((n) => n.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim());
  const achado = campos.find((c) =>
    procurados.includes(String(c.name).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()),
  );
  const v = achado?.values?.[0]?.trim();
  return v ? v : null;
}

/** Lead no formato da API → linha da tabela `rh_leads`. */
export function paraLinhaDoBanco(lead, sincronizadoEm) {
  const campos = lead.field_data ?? [];
  return {
    id: String(lead.id),
    criado_em: lead.created_time,
    ad_id: lead.ad_id ?? null,
    ad_name: lead.ad_name ?? null,
    adset_id: lead.adset_id ?? null,
    adset_name: lead.adset_name ?? null,
    campaign_id: lead.campaign_id ?? null,
    campaign_name: lead.campaign_name ?? null,
    form_id: lead.form_id ?? null,
    form_name: lead.form_name ?? '',
    platform: lead.platform ?? null,
    is_organic: Boolean(lead.is_organic),
    nome: valorDe(campos, CONHECIDOS.nome),
    email: valorDe(campos, CONHECIDOS.email),
    telefone: valorDe(campos, CONHECIDOS.telefone)?.replace(/\s+/g, '') ?? null,
    unidade_escolhida: valorDe(campos, CONHECIDOS.unidade),
    field_data: campos,
    eh_teste: campos.some((c) => (c.values ?? []).some((v) => MARCA_DE_TESTE.test(v))),
    sincronizado_em: sincronizadoEm,
  };
}
