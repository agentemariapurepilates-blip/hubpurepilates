// Comunicado de recesso de fim de ano (26/11/2026), em quatro formatos: A4
// (impresso), feed, stories e quadrado. Mesmo desenho em todos, a partir do
// modelo que a equipe aprovou: fundo creme, título grande em caixa alta com um
// trecho em vermelho itálico (**assim**), o período de recesso e a volta em
// destaque, a mensagem de boas festas e o rodapé "A melhor hora do seu dia".
//
// Tudo é editável no Pure Design; as partes opcionais somem quando ficam vazias
// e podem ser excluídas no editor. O logo é arrastável.

import type { PureDesignTemplate, TemplateField } from './pureDesignTemplates';
import { CREME, GRAFITE, VERMELHO, cabeca, campoLogo } from './pureDesignModelosNovos';

const LINHA = '#e3d8c6';
const CINZA = '#7a716b';

/** Medidas de cada formato. Tamanhos de fonte em px. */
type Formato = {
  id: string;
  nome: string;
  w: number;
  h: number;
  /** Margem das laterais e do rodapé. */
  pad: number;
  /** Onde o logo começa (topo). */
  topo: number;
  /** Onde o texto começa e onde termina (distância do fundo). */
  inicio: number;
  fim: number;
  logo: number;
  f: { selo: number; titulo: number; texto: number; rotulo: number; data: number; msg: number; fecho: number; assinatura: number; rodape: number };
};

const FORMATOS: Formato[] = [
  {
    id: 'a4',
    nome: 'A4 (impresso)',
    w: 1410,
    h: 2000,
    pad: 130,
    topo: 120,
    inicio: 380,
    fim: 250,
    logo: 260,
    f: { selo: 22, titulo: 92, texto: 34, rotulo: 19, data: 88, msg: 34, fecho: 72, assinatura: 32, rodape: 21 },
  },
  {
    id: 'feed',
    nome: 'Feed (1080 × 1350)',
    w: 1080,
    h: 1350,
    pad: 90,
    topo: 84,
    inicio: 250,
    fim: 170,
    logo: 200,
    f: { selo: 17, titulo: 76, texto: 25, rotulo: 16, data: 62, msg: 24, fecho: 50, assinatura: 23, rodape: 16 },
  },
  {
    id: 'stories',
    nome: 'Stories (1080 × 1920)',
    w: 1080,
    h: 1920,
    pad: 96,
    topo: 210,
    inicio: 430,
    fim: 330,
    logo: 220,
    f: { selo: 18, titulo: 68, texto: 28, rotulo: 15, data: 70, msg: 27, fecho: 58, assinatura: 25, rodape: 17 },
  },
  {
    id: 'quadrado',
    nome: 'Quadrado (1080 × 1080)',
    w: 1080,
    h: 1080,
    pad: 76,
    topo: 66,
    inicio: 190,
    fim: 130,
    logo: 170,
    f: { selo: 15, titulo: 60, texto: 20, rotulo: 14, data: 48, msg: 19, fecho: 38, assinatura: 18, rodape: 14 },
  },
];

const rotulo = (fs: number) => `font-size:${fs}px; font-weight:800; letter-spacing:${(fs * 0.28).toFixed(1)}px; text-transform:uppercase; white-space:nowrap; color:${CINZA};`;

function recesso(fm: Formato): string {
  const { w, h, pad, f } = fm;
  const largura = w - pad * 2;
  const alturaLogo = fm.logo * 0.414;
  return `${cabeca('Recesso de fim de ano')}
<style>.rc-titulo strong{color:${VERMELHO}; font-style:italic; font-weight:900 !important}</style>
<div style="position:relative; width:${w}px; height:${h}px; background:${CREME}; overflow:hidden; font-family:Montserrat, sans-serif; color:${GRAFITE};">
<img src="{{logo}}" alt="" style="{{logo:estilo}}"/>
<!--fld:selo--><div class="pd-vazio" style="position:absolute; right:${pad}px; top:${Math.round(fm.topo + alturaLogo / 2 - f.selo * 0.6)}px; ${rotulo(f.selo)}">{{selo}}</div><!--/fld:selo-->
<div style="position:absolute; left:${pad}px; top:${fm.inicio}px; width:${largura}px; height:${h - fm.inicio - fm.fim}px; display:flex; flex-direction:column; justify-content:space-between;">
<div>
<div class="rc-titulo" style="font-size:${f.titulo}px; font-weight:900; line-height:1.02; letter-spacing:-1px; text-transform:uppercase; white-space:pre-line;">{{titulo}}</div>
<!--fld:texto--><div class="pd-vazio" style="margin-top:${Math.round(f.titulo * 0.5)}px; max-width:${Math.round(largura * 0.9)}px; font-size:${f.texto}px; font-weight:600; line-height:1.5; white-space:pre-line;">{{texto}}</div><!--/fld:texto-->
</div>
<div style="display:flex; gap:${Math.round(largura * 0.08)}px; padding:${Math.round(f.data * 0.5)}px 0; border-top:2px solid ${LINHA}; border-bottom:2px solid ${LINHA};">
<div style="flex:none;">
<div class="pd-vazio" style="${rotulo(f.rotulo)}">{{rotuloRecesso}}</div>
<div style="margin-top:${Math.round(f.rotulo * 1.1)}px; font-size:${f.data}px; font-weight:800; line-height:1; letter-spacing:-1px; white-space:nowrap;">{{inicio}}<span style="font-size:${Math.round(f.data * 0.36)}px; font-weight:700; color:${CINZA}; margin:0 ${Math.round(f.data * 0.22)}px; letter-spacing:0;">a</span>{{fim}}</div>
</div>
<!--fld:retorno--><div class="pd-bloco" style="flex:1; min-width:0;">
<div class="pd-vazio" style="${rotulo(f.rotulo)}">{{rotuloRetorno}}</div>
<div class="pd-vazio" style="margin-top:${Math.round(f.rotulo * 1.1)}px; font-size:${f.data}px; font-weight:800; line-height:1; letter-spacing:-1px; color:${VERMELHO}; white-space:nowrap;">{{retorno}}</div>
</div><!--/fld:retorno-->
</div>
<!--fld:mensagem--><div class="pd-vazio" style="max-width:${Math.round(largura * 0.9)}px; font-size:${f.msg}px; font-weight:600; line-height:1.5; white-space:pre-line;">{{mensagem}}</div><!--/fld:mensagem-->
<div>
<div class="pd-vazio" style="font-size:${f.fecho}px; font-weight:800; font-style:italic; line-height:1.1; color:${VERMELHO};">{{fecho}}</div>
<div class="pd-vazio" style="margin-top:${Math.round(f.fecho * 0.3)}px; font-size:${f.assinatura}px; font-weight:700;">{{assinatura}}</div>
</div>
</div>
<!--fld:rodape--><div class="pd-bloco" style="position:absolute; left:${pad}px; right:${pad}px; bottom:${Math.round(fm.fim * 0.45)}px; display:flex; align-items:center; justify-content:space-between;">
<span class="pd-vazio" style="${rotulo(f.rodape)}">{{rodape}}</span>
<span style="display:block; width:${Math.round(f.rodape * 3)}px; height:${Math.max(4, Math.round(f.rodape * 0.3))}px; background:${VERMELHO};"></span>
</div><!--/fld:rodape-->
</div>
</body>
</html>`;
}

const campos = (fm: Formato): TemplateField[] => [
  { id: 'selo', label: 'Etiqueta do alto (opcional)', placeholder: '{{selo}}', defaultValue: 'Comunicado', maxLength: 30 },
  {
    id: 'titulo',
    label: 'Título (use **assim** para o trecho em vermelho)',
    placeholder: '{{titulo}}',
    defaultValue: 'Um novo ano.\nMuitos **movimentos**\npela frente.',
    inputType: 'textarea',
    maxLength: 70,
  },
  {
    id: 'texto',
    label: 'Texto de agradecimento',
    placeholder: '{{texto}}',
    defaultValue: 'Cada aula, cada conquista e cada evolução tornaram este ano especial. Obrigado por compartilhar tantos momentos com a gente e fazer parte da nossa história.',
    inputType: 'textarea',
    maxLength: 220,
  },
  { id: 'rotuloRecesso', label: 'Rótulo do período', placeholder: '{{rotuloRecesso}}', defaultValue: 'Período de recesso', maxLength: 30 },
  { id: 'inicio', label: 'Início do recesso', placeholder: '{{inicio}}', defaultValue: '20/12', maxLength: 8 },
  { id: 'fim', label: 'Fim do recesso', placeholder: '{{fim}}', defaultValue: '04/01', maxLength: 8 },
  { id: 'rotuloRetorno', label: 'Rótulo da volta', placeholder: '{{rotuloRetorno}}', defaultValue: 'Retorno das atividades', maxLength: 30 },
  { id: 'retorno', label: 'Data da volta', placeholder: '{{retorno}}', defaultValue: '05/01', maxLength: 8 },
  {
    id: 'mensagem',
    label: 'Mensagem de fim de ano',
    placeholder: '{{mensagem}}',
    defaultValue: 'Que o novo ano traga saúde, novas conquistas e muitos motivos para continuar em movimento. Nos vemos em breve para viver juntos a melhor hora do seu dia!',
    inputType: 'textarea',
    maxLength: 220,
  },
  { id: 'fecho', label: 'Fechamento', placeholder: '{{fecho}}', defaultValue: 'Boas festas!', maxLength: 30 },
  { id: 'assinatura', label: 'Assinatura', placeholder: '{{assinatura}}', defaultValue: 'Equipe Pure Pilates ❤️', maxLength: 50 },
  { id: 'rodape', label: 'Rodapé (opcional)', placeholder: '{{rodape}}', defaultValue: 'A melhor hora do seu dia', maxLength: 40 },
  campoLogo(false, fm.pad, fm.topo, fm.logo),
];

export const RECESSO: PureDesignTemplate[] = FORMATOS.map((fm) => ({
  id: `recesso-fim-de-ano-${fm.id}`,
  name: `Recesso de fim de ano — ${fm.nome}`,
  category: 'Recesso de fim de ano',
  thumbnail: `/images/pure-design/recesso-fim-de-ano-${fm.id}.jpg`,
  width: fm.w,
  height: fm.h,
  html: recesso(fm),
  fields: campos(fm),
}));

const PALAVRAS = ['recesso', 'recesso de fim de ano', 'fim de ano', 'ferias coletivas', 'boas festas', 'fechado para recesso', 'retorno das atividades', 'comunicado de recesso'];

export const PALAVRAS_RECESSO: Record<string, string[]> = Object.fromEntries(
  FORMATOS.map((fm) => [`recesso-fim-de-ano-${fm.id}`, [...PALAVRAS, fm.id === 'a4' ? 'impresso' : fm.id]]),
);

export const DICAS_RECESSO: Record<string, string> = Object.fromEntries(
  FORMATOS.map((fm) => [
    `recesso-fim-de-ano-${fm.id}`,
    `Comunicado de recesso de fim de ano no formato ${fm.nome}: agradecimento pelo ano, período de recesso, data da volta e boas festas. Use para "recesso", "fechado no fim de ano", "férias coletivas".`,
  ]),
);
