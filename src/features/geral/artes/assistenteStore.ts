// Assistente do Pure Design — o chat que pede a arte e preenche um modelo pronto.
//
// É o chat do Pure GPT, com outro motor: em vez de montar a arte do zero, o
// agente (Edge Function `pure-design-agente`) escolhe um dos modelos do Pure
// Design e escreve o texto de cada campo. Quem desenha é o editor do Pure Design,
// e a pessoa ainda ajusta à mão antes de baixar.

import { supabase } from '@/integrations/supabase/client';
import {
  CATEGORIAS,
  cantoDoLogo,
  fieldIsRemovable,
  posicaoDoLogo,
  pureDesignTemplates,
  type CantoLogo,
  type PureDesignTemplate,
  type RepeatItem,
} from '@/data/pureDesignTemplates';

import { artesProntas } from '@/data/artesProntasData';
export { lerImagem, ImagemRecusada, type ImagemDaUnidade } from '@/features/geral/pure-gpt/pureGptStore';

/** O que o agente devolve quando teve o suficiente para preencher um modelo. */
export interface Preenchimento {
  modelo: string;
  /** campo → texto */
  textos: Record<string, string>;
  /** campo de foto → número da foto enviada na conversa (a primeira é 0) */
  fotos: Record<string, number>;
  /** Itens da lista repetível do modelo (ex.: datas do aviso de feriado). */
  itens?: RepeatItem[];
  /** campo de logo → endereço do logo escolhido pelo agente na biblioteca de marca */
  logos?: Record<string, string>;
  /** Campos que entram excluídos (ex.: fotos da galeria além da quantidade escolhida). */
  removidos?: string[];
  /** Ajustes pedidos na conversa: tamanho de texto, canto e tamanho do logo. */
  ajustes?: Ajuste[];
}

export interface Ajuste {
  campo: string;
  tipo: 'tamanho_texto' | 'posicao_logo' | 'tamanho_logo';
  valor: string;
}

export interface RespostaDoAssistente {
  texto?: string;
  preenchimento?: Preenchimento;
  /** id de uma arte pronta (ex.: a tag do mês), entregue do jeito que está. */
  artePronta?: string;
}

/** As artes prontas que o agente pode entregar (os arquivos finais, como as tags). */
export function prontasParaOAgente() {
  return artesProntas.map((a) => ({ id: a.id, campanha: a.campaign, titulo: a.title, formato: a.format }));
}

/**
 * O catálogo que o agente recebe: id, nome e os campos de cada modelo, com
 * limite e um exemplo. Sai direto de pureDesignTemplates — então todo modelo
 * novo que entrar no Pure Design já aparece para o agente, sem lista paralela.
 */
export function catalogoParaOAgente(modelos: PureDesignTemplate[] = pureDesignTemplates) {
  return modelos.map((m) => ({
    id: m.id,
    nome: m.name,
    categoria: m.category,
    coringa: m.coringa === true,
    palavrasChave: m.palavrasChave ?? [],
    dica: m.dica,
    campos: m.fields.map((f) => ({
      id: f.id,
      rotulo: f.label,
      tipo:
        f.inputType === 'image' ? 'foto' : f.inputType === 'logo' ? 'logo' : f.inputType === 'textarea' ? 'texto-longo' : 'texto',
      unidadesLogo: f.unidadesLogo,
      obrigatoria: f.obrigatoria === true,
      // Pode ser escondido na arte (etiqueta, botão, chamada, foto da galeria…).
      removivel: fieldIsRemovable(m, f.id),
      limite: f.maxLength,
      // Exemplo de foto/logo é uma imagem: não serve de nada para o agente.
      exemplo: f.inputType === 'image' || f.inputType === 'logo' ? undefined : f.defaultValue,
    })),
    // Lista repetível (ex.: datas do feriado): o agente preenche os itens.
    lista: m.repeat
      ? {
          rotulo: m.repeat.itemLabel,
          variantes: m.repeat.variants.map((v) => ({ id: v.id, nome: v.label })),
          exemplo: m.repeat.initial,
        }
      : undefined,
    // Galeria: as fotos se reorganizam conforme a quantidade (1 a N).
    galeria: m.galeria ? { campos: m.galeria.campos, maximo: m.galeria.campos.length } : undefined,
    observacao: m.table ? 'tem uma tabela de produtos e preços que a pessoa preenche no editor.' : undefined,
  }));
}

/**
 * Valores prontos para o editor: os textos do agente e as fotos (como data URL)
 * nos campos certos. O que o agente não preencheu fica com o padrão do modelo.
 */
export function valoresDoPreenchimento(p: Preenchimento, fotos: string[]): Record<string, string> {
  const valores: Record<string, string> = { ...p.textos, ...(p.logos ?? {}) };
  for (const [campo, n] of Object.entries(p.fotos ?? {})) {
    if (fotos[n]) valores[campo] = fotos[n];
  }
  // Ajustes: tamanho de texto vira "<campo>__tam"; logo vira posição/escala.
  const modelo = pureDesignTemplates.find((t) => t.id === p.modelo);
  for (const a of p.ajustes ?? []) {
    if (a.tipo === 'tamanho_texto') valores[`${a.campo}__tam`] = a.valor;
    const caixa = modelo?.fields.find((f) => f.id === a.campo)?.logoCaixa;
    if (!modelo || !caixa) continue;
    if (a.tipo === 'tamanho_logo') valores[`${a.campo}__escala`] = a.valor;
    if (a.tipo === 'posicao_logo') {
      const escala = posicaoDoLogo(a.campo, caixa, valores).escala;
      const pos = cantoDoLogo(a.valor as CantoLogo, caixa, escala, modelo.width, modelo.height);
      valores[`${a.campo}__x`] = String(Math.round(pos.x));
      valores[`${a.campo}__y`] = String(Math.round(pos.y));
    }
  }
  return valores;
}

/**
 * As categorias como o agente as recebe: o que cada uma cobre e quantos modelos
 * com e sem foto ela tem. É com isto que ele decide a categoria e o que perguntar.
 */
export function categoriasParaOAgente(modelos: PureDesignTemplate[] = pureDesignTemplates) {
  const nomes = Array.from(new Set(modelos.map((m) => m.category)));
  return nomes.map((nome) => {
    const daCategoria = modelos.filter((m) => m.category === nome);
    const comFoto = daCategoria.filter((m) => m.fields.some((f) => f.inputType === 'image')).length;
    return {
      nome,
      descricao: CATEGORIAS[nome] ?? '',
      modelos: daCategoria.map((m) => m.id),
      comFoto,
      semFoto: daCategoria.length - comFoto,
    };
  });
}

export async function conversar(entrada: {
  mensagens: { autor: 'pessoa' | 'pure'; texto: string }[];
  fotos: number;
  /** A última arte gerada na conversa: é ela que "muda esse texto" ajusta. */
  arteAtual?: Preenchimento;
}): Promise<RespostaDoAssistente> {
  const { data, error } = await supabase.functions.invoke('pure-design-agente', {
    body: {
      ...entrada,
      modelos: catalogoParaOAgente(),
      categorias: categoriasParaOAgente(),
      prontas: prontasParaOAgente(),
    },
  });
  if (error) {
    // A function devolve a explicação no corpo; o erro do cliente não a traz.
    const corpo = await (error as { context?: { json?: () => Promise<{ erro?: string }> } })?.context
      ?.json?.()
      .catch(() => null);
    throw new Error(corpo?.erro ?? 'o assistente não respondeu. Tente de novo em instantes.');
  }
  if (data?.erro) throw new Error(data.erro);
  return data as RespostaDoAssistente;
}
