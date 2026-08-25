/**
 * Leads de RH: normalização e agrupamento por conjunto de anúncio.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * O QUE A CONTA DE VERDADE MOSTROU (18/08/2026)
 * ────────────────────────────────────────────────────────────────────────────
 *
 * Duas campanhas de RH, 33 conjuntos, um por unidade:
 *   · [Rise] lead-ad   | always-on | rh-instrutor  — formulário nativo do Meta
 *   · [Rise] lead-site | always-on | rh-instrutor  — formulário no site
 *
 * Só a primeira gera lead recuperável por API: no lead-site o formulário é do
 * site, e o Meta só registra a conversão pelo pixel. Por isso este módulo
 * trabalha com os formulários nativos, e a tela diz que o lead-site fica fora.
 *
 * O nome do conjunto carrega a unidade — `penha | sao-paulo | cargos |
 * instrutor-pilates` — e é dele que sai a separação pedida. A leitura do nome é
 * feita em `./nomeDoConjunto`, o único lugar do Hub que sabe o formato dos
 * nomes da conta de anúncios.
 */

import { interpretarConjunto } from './nomeDoConjunto';

/** Um campo respondido no formulário, como a Graph API devolve. */
export interface CampoDoFormulario {
  name: string;
  values: string[];
}

/** O lead cru, no formato da Graph API do Meta. */
export interface LeadBruto {
  id: string;
  created_time: string;
  ad_id?: string | null;
  ad_name?: string | null;
  adset_id?: string | null;
  adset_name?: string | null;
  campaign_id?: string | null;
  campaign_name?: string | null;
  form_id?: string | null;
  form_name?: string | null;
  platform?: string | null;
  is_organic?: boolean | null;
  field_data?: CampoDoFormulario[] | null;
}

export interface LeadRH {
  id: string;
  /** ISO, como veio. Ordenar por texto já dá ordem cronológica. */
  criadoEm: string;
  conjuntoId: string | null;
  conjuntoNome: string | null;
  /** A unidade lida do NOME DO CONJUNTO — de onde o anúncio saiu. */
  unidadeDoConjunto: string | null;
  campanha: string | null;
  anuncio: string | null;
  formulario: string | null;
  plataforma: string | null;
  organico: boolean;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  /** A unidade que o CANDIDATO escolheu no formulário. Pode divergir da outra. */
  unidadeEscolhida: string | null;
  /** Todo o resto do formulário, na ordem em que veio. */
  respostas: Array<{ pergunta: string; resposta: string }>;
  /**
   * Lead de teste, criado pela ferramenta de testes do Meta. Vem com o texto
   * `<test lead: dummy data for ...>` nos campos.
   */
  ehTeste: boolean;
}

/** Nomes de campo que o formulário de RH usa hoje, por papel. */
const CAMPOS_CONHECIDOS: Record<'nome' | 'email' | 'telefone' | 'unidade', string[]> = {
  nome: ['full_name', 'nome', 'nome_completo', 'first_name'],
  email: ['email', 'e-mail'],
  telefone: ['phone_number', 'telefone', 'celular', 'whatsapp'],
  unidade: ['selecione_a_unidade', 'unidade', 'qual_unidade', 'selecione_a_unidade?'],
};

const MARCA_DE_TESTE = /<test lead/i;

/** Minúsculas, sem acento — os nomes de campo do Meta variam em acentuação. */
function chave(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function valorDe(campos: CampoDoFormulario[], nomes: string[]): string | null {
  const procurados = nomes.map(chave);
  const achado = campos.find((c) => procurados.includes(chave(c.name)));
  const valor = achado?.values?.[0]?.trim();
  return valor ? valor : null;
}

/**
 * Telefone como o Meta entrega: `+5511999999999`.
 *
 * Fica como veio, e não formatado. Quem usa esta lista disca ou cola no
 * WhatsApp, e os dois querem o número com DDI. Formatar aqui obrigaria a
 * desformatar do outro lado.
 */
function telefoneDe(campos: CampoDoFormulario[]): string | null {
  const bruto = valorDe(campos, CAMPOS_CONHECIDOS.telefone);
  return bruto ? bruto.replace(/\s+/g, '') : null;
}

/** A pergunta como deve aparecer para uma pessoa: `nome_completo` → `Nome completo`. */
export function rotuloDaPergunta(nome: string): string {
  const limpo = nome.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  return limpo.charAt(0).toUpperCase() + limpo.slice(1);
}

export function normalizarLead(bruto: LeadBruto): LeadRH {
  const campos = bruto.field_data ?? [];

  const usados = new Set(
    [
      ...CAMPOS_CONHECIDOS.nome,
      ...CAMPOS_CONHECIDOS.email,
      ...CAMPOS_CONHECIDOS.telefone,
      ...CAMPOS_CONHECIDOS.unidade,
    ].map(chave),
  );

  return {
    id: bruto.id,
    criadoEm: bruto.created_time,
    conjuntoId: bruto.adset_id ?? null,
    conjuntoNome: bruto.adset_name ?? null,
    unidadeDoConjunto: bruto.adset_name ? interpretarConjunto(bruto.adset_name).unidade : null,
    campanha: bruto.campaign_name ?? null,
    anuncio: bruto.ad_name ?? null,
    formulario: bruto.form_name ?? null,
    plataforma: bruto.platform ?? null,
    organico: Boolean(bruto.is_organic),
    nome: valorDe(campos, CAMPOS_CONHECIDOS.nome),
    email: valorDe(campos, CAMPOS_CONHECIDOS.email),
    telefone: telefoneDe(campos),
    unidadeEscolhida: valorDe(campos, CAMPOS_CONHECIDOS.unidade),
    // O resto do formulário, sem repetir o que já virou coluna própria.
    respostas: campos
      .filter((c) => !usados.has(chave(c.name)))
      .map((c) => ({
        pergunta: rotuloDaPergunta(c.name),
        resposta: (c.values ?? []).join(', '),
      })),
    ehTeste: campos.some((c) => (c.values ?? []).some((v) => MARCA_DE_TESTE.test(v))),
  };
}

export interface GrupoDeConjunto {
  conjuntoId: string | null;
  conjuntoNome: string;
  /** A unidade do conjunto, quando o nome permite lê-la. */
  unidade: string | null;
  leads: LeadRH[];
  /** Pessoas distintas dentro do grupo. */
  distintos: number;
}

/** O grupo dos leads que não vieram de anúncio nenhum. */
export const SEM_CONJUNTO = 'Sem conjunto (lead orgânico)';

/**
 * Um grupo por conjunto de anúncio, do maior para o menor.
 *
 * Lead sem conjunto NÃO é descartado: vai para um grupo próprio. Descartar
 * esconderia candidato de verdade — o formulário fica aberto na página, e quem
 * chega por lá não passa por anúncio nenhum.
 */
export function agruparPorConjunto(leads: LeadRH[]): GrupoDeConjunto[] {
  const grupos = new Map<string, GrupoDeConjunto>();

  for (const lead of leads) {
    const nome = lead.conjuntoNome ?? SEM_CONJUNTO;
    const atual = grupos.get(nome) ?? {
      conjuntoId: lead.conjuntoId,
      conjuntoNome: nome,
      unidade: lead.unidadeDoConjunto,
      leads: [],
      distintos: 0,
    };
    atual.leads.push(lead);
    grupos.set(nome, atual);
  }

  for (const grupo of grupos.values()) {
    grupo.leads.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
    grupo.distintos = contarDistintos(grupo.leads);
  }

  return [...grupos.values()].sort(
    (a, b) => b.leads.length - a.leads.length || a.conjuntoNome.localeCompare(b.conjuntoNome),
  );
}

/**
 * Quantas PESSOAS diferentes há na lista.
 *
 * A mesma pessoa se candidata mais de uma vez com frequência — clica no anúncio
 * de novo dias depois. Para o RH, "40 leads" e "31 pessoas" são números
 * diferentes, e é o segundo que diz quantas ligações fazer.
 */
export function contarDistintos(leads: LeadRH[]): number {
  const vistos = new Set<string>();
  for (const lead of leads) {
    const identidade = chave(lead.email ?? '') || lead.telefone || lead.id;
    vistos.add(identidade);
  }
  return vistos.size;
}

export interface FiltroDeLeads {
  /** Texto livre: nome, e-mail, telefone, unidade. */
  busca?: string;
  /** Só os de um conjunto. */
  conjuntoNome?: string | null;
  /** Incluir os leads de teste do Meta. Fora por padrão. */
  incluirTestes?: boolean;
  /** yyyy-MM-dd, inclusivo. */
  de?: string;
  ate?: string;
}

export function filtrarLeads(leads: LeadRH[], filtro: FiltroDeLeads): LeadRH[] {
  const busca = filtro.busca ? chave(filtro.busca) : '';

  return leads.filter((lead) => {
    // Lead de teste fica FORA por padrão. Ele entraria na planilha que o RH usa
    // para ligar, e ninguém liga para "<test lead: dummy data>".
    if (!filtro.incluirTestes && lead.ehTeste) return false;

    if (filtro.conjuntoNome && (lead.conjuntoNome ?? SEM_CONJUNTO) !== filtro.conjuntoNome) {
      return false;
    }

    // `criadoEm` é ISO com fuso; os dez primeiros caracteres são a data.
    const dia = lead.criadoEm.slice(0, 10);
    if (filtro.de && dia < filtro.de) return false;
    if (filtro.ate && dia > filtro.ate) return false;

    if (busca) {
      const alvo = chave(
        [
          lead.nome,
          lead.email,
          lead.telefone,
          lead.unidadeEscolhida,
          lead.unidadeDoConjunto,
          lead.conjuntoNome,
          ...lead.respostas.map((r) => r.resposta),
        ]
          .filter(Boolean)
          .join(' '),
      );
      if (!alvo.includes(busca)) return false;
    }

    return true;
  });
}
