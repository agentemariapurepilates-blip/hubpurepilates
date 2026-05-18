import type { Avatar } from '../data/avatares';
import type { Aparelho } from '../data/aparelhos';
import type { Uniforme } from '../data/uniformes';
import {
  ENQUADRAMENTO_BLOCKS,
  ANGULO_BLOCKS,
  ILUMINACAO_BLOCKS,
  FUNDO_BLOCKS,
  MARCA_EXTRA_BLOCKS,
  type Enquadramento,
  type AnguloCamera,
  type IluminacaoPreset,
  type FundoPreset,
  type MarcaExtra,
} from '../data/presets';

export type SceneState = {
  avatares: Avatar[];
  enquadramento: Enquadramento | null;
  angulo: AnguloCamera | null;
  pose: string;
  aparelhos: Aparelho[];
  uniformes: Uniforme[];
  roupaCustom: string;
  iluminacao: IluminacaoPreset | null;
  fundo: { preset: FundoPreset | null; custom?: string };
  marcaExtras: MarcaExtra[];
  notas: string;
};

export const INITIAL_SCENE_STATE: SceneState = {
  avatares: [],
  enquadramento: null,
  angulo: null,
  pose: '',
  aparelhos: [],
  uniformes: [],
  roupaCustom: '',
  iluminacao: 'padrao-pure',
  fundo: { preset: 'ciclorama-padrao-pure' },
  marcaExtras: [],
  notas: '',
};

function describeModelos(avatares: Avatar[]): string {
  if (avatares.length === 0) return '';
  if (avatares.length === 1) {
    const a = avatares[0];
    const totalFotos = a.referencias.length;
    return `MODELO PRINCIPAL — IDENTIDADE FIEL:
A pessoa que deve aparecer na imagem gerada é EXATAMENTE a mesma pessoa retratada nas ${totalFotos} foto${totalFotos === 1 ? '' : 's'} de referência anexada${totalFotos === 1 ? '' : 's'} ao início desta requisição (nome interno: ${a.nome}).
- USE essas fotos como referência absoluta de rosto, traços faciais, formato do crânio, olhos, nariz, boca, sobrancelhas, orelhas, cabelo (cor, textura, comprimento, corte), tom de pele, idade aparente, formato e proporções do corpo.
- O resultado precisa ser RECONHECIVELMENTE a mesma pessoa — uma pessoa que conhece o(a) ${a.nome} olharia a imagem gerada e diria sem hesitar "é o(a) mesmo(a)".
- NÃO invente uma pessoa nova, NÃO crie um híbrido entre as referências, NÃO substitua por alguém parecido. Só essa pessoa.`;
  }

  const nomes = avatares.map((a) => a.nome).join(' e ');
  const detalhes = avatares
    .map((a) => `  • ${a.nome}: ${a.referencias.length} foto${a.referencias.length === 1 ? '' : 's'} de referência`)
    .join('\n');
  return `MODELOS NA CENA — ${avatares.length} PESSOAS DISTINTAS, IDENTIDADE FIEL:
A imagem gerada deve conter EXATAMENTE estas ${avatares.length} pessoas (${nomes}), e mais ninguém:
${detalhes}
As fotos de cada uma foram enviadas em anexo no início desta requisição, na ordem listada acima.
- USE essas fotos como referência absoluta de cada uma: rosto, traços faciais, cabelo, tom de pele, proporções.
- Cada pessoa na imagem final precisa ser RECONHECIVELMENTE a mesma das suas referências.
- NÃO invente pessoas, NÃO misture traços entre elas, NÃO duplique uma como se fosse outra.`;
}

function describeRoupa(state: SceneState): string | null {
  const hasUniformes = state.uniformes.length > 0;
  const custom = state.roupaCustom.trim();
  if (!hasUniformes && !custom) return null;

  const partes: string[] = [];
  if (hasUniformes) {
    const nomes = state.uniformes.map((u) => u.nome).join(', ');
    partes.push(
      `as peças mostradas nas imagens de referência (${nomes}) — usar EXATAMENTE essas peças, com os mesmos detalhes visuais`
    );
  }
  if (custom) {
    partes.push(custom);
  }
  return `Veste ${partes.join('; ')}.`;
}

export function composePrompt(state: SceneState): string {
  const blocos: string[] = [];

  if (state.enquadramento) {
    blocos.push(`ENQUADRAMENTO: ${ENQUADRAMENTO_BLOCKS[state.enquadramento].texto}`);
  }
  if (state.angulo) {
    blocos.push(`CÂMERA: ${ANGULO_BLOCKS[state.angulo].texto}`);
  }

  const modelos = describeModelos(state.avatares);
  if (modelos) blocos.push(`\n${modelos}`);

  if (state.pose.trim()) {
    blocos.push(`\nPOSE: ${state.pose.trim()}`);
  }

  if (state.aparelhos.length > 0) {
    const nomes = state.aparelhos.map((a) => a.nome).join(', ');
    const ehPlural = state.aparelhos.length > 1;
    blocos.push(
      `\nAPARELHO${ehPlural ? 'S' : ''} PURE PILATES — REFERÊNCIA VISUAL OBRIGATÓRIA:
${ehPlural ? 'Os aparelhos usados são' : 'O aparelho usado é'} EXATAMENTE ${ehPlural ? 'os modelos mostrados' : 'o modelo mostrado'} nas foto${ehPlural ? 's' : ''} de referência anexada${ehPlural ? 's' : ''} (${nomes}). Formato, cor, materiais, proporções e detalhes idênticos às fotos. NÃO invente um aparelho genérico nem substitua por modelo parecido — use o aparelho da Pure Pilates exatamente como mostrado.`
    );
  }

  const roupa = describeRoupa(state);
  if (roupa) {
    blocos.push(`\nROUPA: ${roupa}`);
  }

  if (state.iluminacao) {
    blocos.push(`\nILUMINAÇÃO: ${ILUMINACAO_BLOCKS[state.iluminacao].texto}`);
  }

  if (state.fundo.preset === 'custom' && state.fundo.custom?.trim()) {
    blocos.push(`\nFUNDO: ${state.fundo.custom.trim()}`);
  } else if (state.fundo.preset && state.fundo.preset !== 'custom') {
    blocos.push(`\nFUNDO: ${FUNDO_BLOCKS[state.fundo.preset].texto}`);
  }

  if (state.marcaExtras.length > 0) {
    const extras = state.marcaExtras.map((m) => MARCA_EXTRA_BLOCKS[m].texto).join(' ');
    const temReferencia = state.marcaExtras.some(
      (m) => (MARCA_EXTRA_BLOCKS[m].referencias?.length ?? 0) > 0
    );
    const sufixo = temReferencia
      ? ' Use os elementos da marca EXATAMENTE como mostrados nas fotos de referência anexadas — formato, cor, materiais e detalhes idênticos.'
      : '';
    blocos.push(`\nELEMENTOS DA MARCA: ${extras}${sufixo}`);
  }

  if (state.notas.trim()) {
    blocos.push(`\nDETALHES ADICIONAIS: ${state.notas.trim()}`);
  }

  return blocos.join('\n');
}
