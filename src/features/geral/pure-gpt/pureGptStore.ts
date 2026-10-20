// Pure GPT — o gerador de artes dos franqueados.
//
// A conversa vai para a Edge Function `pure-gpt-gerar`, que é o agente: ele lê
// o que a pessoa escreveu e, quando tem o suficiente, MONTA a arte — escolhe o
// fundo, escreve o texto, decide posição e hierarquia — devolvendo a composição
// em JSON. Quem desenha é composicao.ts, aqui no Hub. As REGRAS DA MARCA ficam
// no servidor, junto da function — nunca aqui — para que o texto de quem pede
// não consiga sobrescrevê-las.
//
// A TELA É SÓ A CONVERSA. Os campos que existiam aqui (tipo de peça, formato,
// unidade, elementos da marca) saíram em 19/10/2026: o logotipo passou a ser
// desenhado pelo Hub, o formato é um só, e o que falta o agente pergunta na
// conversa. Restou o que o chat precisa — ler a foto anexada e falar com ele.

import { supabase } from '@/integrations/supabase/client';
import { FUNDOS, type Composicao } from './composicao';

/** Enquanto false, a tela mostra que a geração ainda não está disponível. */
export const GERACAO_LIGADA = true;

/** Foto que a própria unidade subiu (professor, estúdio, aluno). */
export interface ImagemDaUnidade {
  id: string;
  nome: string;
  /** data URL, que é o formato que entra direto na arte. */
  dataUrl: string;
}

/** Acima disso o envio fica lento e a arte não ganha nada em qualidade. */
export const TAMANHO_MAXIMO_MB = 8;

export class ImagemRecusada extends Error {}

/** Lê o arquivo escolhido e devolve pronto para entrar numa moldura. */
export function lerImagem(arquivo: File): Promise<ImagemDaUnidade> {
  if (!arquivo.type.startsWith('image/')) {
    return Promise.reject(new ImagemRecusada('Só dá para usar imagens (JPG, PNG ou WEBP).'));
  }
  if (arquivo.size > TAMANHO_MAXIMO_MB * 1024 * 1024) {
    return Promise.reject(
      new ImagemRecusada(`A imagem passa de ${TAMANHO_MAXIMO_MB} MB. Use uma versão menor.`),
    );
  }
  return new Promise((resolver, recusar) => {
    const leitor = new FileReader();
    leitor.onload = () =>
      resolver({
        id: `${arquivo.name}-${arquivo.size}-${arquivo.lastModified}`,
        nome: arquivo.name,
        dataUrl: String(leitor.result),
      });
    leitor.onerror = () => recusar(new ImagemRecusada('Não foi possível ler a imagem.'));
    leitor.readAsDataURL(arquivo);
  });
}

export interface RespostaDoAgente {
  /** O que o Pure GPT respondeu por escrito. */
  texto?: string;
  /** A arte montada, quando ele teve o suficiente para montar. */
  composicao?: Composicao;
}

/**
 * Manda a conversa ao agente e devolve o que ele respondeu — um texto, uma arte
 * montada, ou os dois. Quem decide se é hora de montar é ele, não a tela: é
 * isso que faz o Pure GPT parecer um GPT e não um formulário.
 *
 * O agente vive numa Edge Function porque as regras da marca não podem passar
 * pelo navegador: ali o texto de quem pede não alcança elas.
 */
export async function conversar(entrada: {
  mensagens: { autor: 'pessoa' | 'pure'; texto: string }[];
  /** Quantas fotos já foram anexadas na conversa, à disposição das molduras. */
  fotos: number;
}): Promise<RespostaDoAgente> {
  // O catálogo de fundos viaja no pedido: ele mora em composicao.ts, junto do
  // código que desenha. Mandar daqui evita a segunda lista, na function, que
  // ficaria para trás no dia em que alguém acrescentasse um fundo.
  const fundos = FUNDOS.map(({ id, nome, escuro, limpo }) => ({ id, nome, escuro, limpo }));

  const { data, error } = await supabase.functions.invoke('pure-gpt-gerar', {
    body: { ...entrada, fundos },
  });
  if (error) {
    // A function devolve a explicação no corpo; o erro do cliente não a traz.
    const corpo = await (error as { context?: { json?: () => Promise<{ erro?: string }> } })?.context
      ?.json?.()
      .catch(() => null);
    throw new Error(corpo?.erro ?? 'o Pure GPT não respondeu. Tente de novo em instantes.');
  }
  if (data?.erro) throw new Error(data.erro);
  return data as RespostaDoAgente;
}
