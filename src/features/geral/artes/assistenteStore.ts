// Assistente do Pure Design — o chat que pede a arte e preenche um modelo pronto.
//
// É o chat do Pure GPT, com outro motor: em vez de montar a arte do zero, o
// agente (Edge Function `pure-design-agente`) escolhe um dos modelos do Pure
// Design e escreve o texto de cada campo. Quem desenha é o editor do Pure Design,
// e a pessoa ainda ajusta à mão antes de baixar.

import { supabase } from '@/integrations/supabase/client';
import { CATEGORIAS, pureDesignTemplates, type PureDesignTemplate, type RepeatItem } from '@/data/pureDesignTemplates';

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
}

export interface RespostaDoAssistente {
  texto?: string;
  preenchimento?: Preenchimento;
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
      tipo: f.inputType === 'image' ? 'foto' : f.inputType === 'textarea' ? 'texto-longo' : 'texto',
      limite: f.maxLength,
      // Exemplo de foto é uma imagem embutida: não serve de nada para o agente.
      exemplo: f.inputType === 'image' ? undefined : f.defaultValue,
    })),
    // Lista repetível (ex.: datas do feriado): o agente preenche os itens.
    lista: m.repeat
      ? {
          rotulo: m.repeat.itemLabel,
          variantes: m.repeat.variants.map((v) => ({ id: v.id, nome: v.label })),
          exemplo: m.repeat.initial,
        }
      : undefined,
    observacao: m.table ? 'tem uma tabela de produtos e preços que a pessoa preenche no editor.' : undefined,
  }));
}

/**
 * Valores prontos para o editor: os textos do agente e as fotos (como data URL)
 * nos campos certos. O que o agente não preencheu fica com o padrão do modelo.
 */
export function valoresDoPreenchimento(p: Preenchimento, fotos: string[]): Record<string, string> {
  const valores: Record<string, string> = { ...p.textos };
  for (const [campo, n] of Object.entries(p.fotos ?? {})) {
    if (fotos[n]) valores[campo] = fotos[n];
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
}): Promise<RespostaDoAssistente> {
  const { data, error } = await supabase.functions.invoke('pure-design-agente', {
    body: { ...entrada, modelos: catalogoParaOAgente(), categorias: categoriasParaOAgente() },
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
