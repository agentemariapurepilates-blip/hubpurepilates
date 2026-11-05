// O pedido da foto da capa. Sem dependência do Deno, para ser testado.
//
// O estilo de cada marca saiu das três fotos de exemplo aprovadas pela usuária
// em 05/11/2026: Studios claro (cinza claro e vermelho), Academy branco e
// vermelho, Franchising escuro (preto e vermelho). As cores seguem o vermelho
// Pure #C12030 e o cinza escuro #231F20; fundo verde ou frio já foi reprovado.

import type { Marca } from './marcas.ts'

const ESTILO: Record<Marca, string> = {
  studios:
    'Bright modern boutique Pilates studio with light gray walls, white floor and one deep red accent wall, soft natural daylight from large windows. Clean, minimal, airy, premium feel. Color palette: light gray, white, light wood and deep red (#C12030) accents only.',
  academy:
    'Bright white Pilates studio, white walls, deep red upholstery on the equipment, soft daylight. A precise, attentive moment that conveys expertise and authority. Clean and premium. Color palette: white and deep red (#C12030) only, with light wood.',
  franchising:
    'Modern premium Pilates studio with low-key, sophisticated lighting, charcoal and near-black walls with subtle deep red accent light. Conveys entrepreneurship and confidence. Color palette: black, charcoal (#231F20) and deep red (#C12030) only.',
}

const PROIBIDO =
  'Absolutely no text, letters, words, numbers, logos, watermarks or signage anywhere in the image. No green or blue tones. No distorted hands, extra fingers or extra limbs.'

/**
 * Monta o pedido da foto. `cena` é a descrição em inglês que o Gemini escreveu
 * junto com o artigo; sem ela (artigos antigos), a foto parte do título.
 */
export function promptDaFoto(marca: Marca, cena: string | null | undefined, titulo: string): string {
  const assunto = cena?.trim()
    ? cena.trim()
    : `A realistic scene that illustrates a Pilates blog article titled "${titulo}". Brazilian people, natural poses.`
  return [
    'Editorial photograph for the Pure Pilates blog.',
    assunto,
    ESTILO[marca],
    'Natural skin tones. Shot on a 50mm lens, shallow depth of field, main subject centered in the frame with some breathing room around it.',
    PROIBIDO,
  ].join(' ')
}
