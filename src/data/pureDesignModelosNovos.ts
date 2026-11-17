// Modelos novos do Pure Design (17/11/2026), desenhados em HTML no padrão da marca.
//
// Três esqueletos, para a rede ter consistência entre as peças:
//  - CARTÃO SOBRE FOTO: a foto ocupa a arte inteira (enquadrável) e um cartão
//    creme embaixo traz chamada, título, texto e botão. Ex.: aula experimental,
//    novo instrutor, Natal com foto.
//  - TIPOGRÁFICO: fundo de cor da marca com pétalas em contorno, etiqueta,
//    título grande, texto, até três "informações" (data, horário, local) e
//    botão. Ex.: aulão, Black Friday, mudança de horário, Natal sem foto.
//  - LISTA: fundo creme, título e uma lista editável (itens que a pessoa
//    adiciona/remove). Ex.: grade de horários, aniversariantes do mês.
//
// Tudo é 1080x1350 (4:5, feed). Partes opcionais somem quando ficam vazias e
// podem ser removidas no editor. O logo é arrastável (campo de logo).

import type { PureDesignTemplate, RepeatConfig, TemplateField } from './pureDesignTemplates';

export const W = 1080;
export const H = 1350;
export const VERMELHO = '#C12030';
export const GRAFITE = '#231F20';
export const CREME = '#f8f3e8';

/** Moldura vazia (até a pessoa subir a foto): creme com ícone de foto. */
const fotoVazia =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' preserveAspectRatio='xMidYMid slice'>
      <rect width='400' height='400' fill='#e9dfcf'/>
      <g fill='none' stroke='#b9a98f' stroke-width='8' stroke-linejoin='round'>
        <rect x='140' y='160' width='120' height='86' rx='12'/>
        <circle cx='200' cy='203' r='22'/>
      </g>
    </svg>`,
  );

export const cabeca = (titulo: string) => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${titulo}</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
</head>
<body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#f0f0f0;">
<style>.pd-vazio:empty{display:none !important}.pd-bloco:has(> .pd-vazio:empty){display:none !important}</style>`;

/** Pétala da marca (3 cantos redondos + 1 reto), em contorno. */
const petala = (tam: number, pos: string, cor: string, opacidade: number, giro = 0) =>
  `<svg width="${tam}" height="${tam}" viewBox="0 0 250 250" style="position:absolute; ${pos}; transform:rotate(${giro}deg);"><path d="M 125 0 A 125 125 0 0 1 250 125 L 250 250 L 125 250 A 125 125 0 0 1 0 125 A 125 125 0 0 1 125 0 Z" fill="none" stroke="${cor}" stroke-width="3" opacity="${opacidade}"/></svg>`;

export const pilula = (token: string, fundo: string, cor: string, tam = 21) =>
  `<span class="pd-vazio" style="display:inline-block; box-sizing:border-box; padding:0 32px; height:${tam * 2.6}px; line-height:${tam * 2.6}px; border-radius:${tam * 1.3}px; background:${fundo}; color:${cor}; font-size:${tam}px; font-weight:400; letter-spacing:4px; text-transform:uppercase; white-space:nowrap;">${token}</span>`;

// Campo de logo: o mesmo arquivo da marca, branco ou colorido conforme o fundo.
export const campoLogo = (branco: boolean, x: number, y: number, largura = 230): TemplateField => ({
  id: 'logo',
  label: 'Logo',
  placeholder: '{{logo}}',
  defaultValue: '/images/pure-design/pure-pilates-logo-trim.png',
  inputType: 'logo',
  unidadesLogo: ['Pure Pilates'],
  logoCaixa: { x, y, largura, proporcao: 0.414, ...(branco ? { filtro: 'brightness(0) invert(1)' } : {}) },
});

// ── Esqueleto 1: cartão sobre foto ──────────────────────────────────────────
function cartaoSobreFoto(t: { titulo: string }): string {
  return `${cabeca(t.titulo)}
<div style="position:relative; width:${W}px; height:${H}px; background:#e9dccb; overflow:hidden; font-family:Montserrat, sans-serif;">
<img src="{{fundo}}" style="position:absolute; left:0; top:0; width:${W}px; height:${H}px; object-fit:cover; display:block;" onerror="this.src='${fotoVazia}'"/>
<img src="{{logo}}" alt="" style="{{logo:estilo}}"/>
<!--fld:selo--><div class="pd-bloco" style="position:absolute; left:80px; top:80px;">${pilula('{{selo}}', VERMELHO, '#f7efe3')}</div><!--/fld:selo-->
<div style="position:absolute; left:80px; bottom:80px; width:920px; box-sizing:border-box; padding:46px 56px 48px; border-radius:36px; background:${CREME}; color:${VERMELHO};">
<!--fld:chamada--><div class="pd-vazio" style="font-size:25px; font-weight:300; line-height:1.3; margin-bottom:18px;">{{chamada}}</div><!--/fld:chamada-->
<div style="font-size:52px; font-weight:300; line-height:1.12;">{{titulo}}</div>
<div class="pd-vazio" style="margin-top:20px; font-size:26px; font-weight:300; line-height:1.5; color:#b0505f; white-space:pre-line;">{{texto}}</div>
<!--fld:botao--><div class="pd-bloco" style="margin-top:30px; padding-top:30px; border-top:2px solid rgba(193,32,48,.8);">${pilula('{{botao}}', VERMELHO, '#f7efe3', 20)}</div><!--/fld:botao-->
</div>
</div>
</body>
</html>`;
}

const camposCartao = (d: {
  fundo: string;
  selo: string;
  chamada: string;
  titulo: string;
  texto: string;
  botao: string;
}): TemplateField[] => [
  { id: 'fundo', label: d.fundo, placeholder: '{{fundo}}', defaultValue: fotoVazia, inputType: 'image', obrigatoria: true },
  { id: 'selo', label: 'Etiqueta do alto (opcional)', placeholder: '{{selo}}', defaultValue: d.selo, maxLength: 22 },
  { id: 'chamada', label: 'Chamada pequena (opcional)', placeholder: '{{chamada}}', defaultValue: d.chamada, maxLength: 40 },
  { id: 'titulo', label: 'Título', placeholder: '{{titulo}}', defaultValue: d.titulo, inputType: 'textarea', maxLength: 60 },
  { id: 'texto', label: 'Texto', placeholder: '{{texto}}', defaultValue: d.texto, inputType: 'textarea', maxLength: 160 },
  { id: 'botao', label: 'Botão (opcional)', placeholder: '{{botao}}', defaultValue: d.botao, maxLength: 30 },
  campoLogo(true, 790, 84, 210),
];

// ── Variação: retrato emoldurado ─────────────────────────────────────────────
// Fundo creme, foto dentro de uma moldura em pétala (3 cantos redondos + 1 reto)
// com um contorno vermelho deslocado atrás, e o texto centralizado embaixo.
// Para apresentar pessoas (novo instrutor), onde a foto é o centro da peça.
function retratoEmoldurado(t: { titulo: string }): string {
  const lado = 600;
  const x = (W - lado) / 2;
  const y = 250;
  const raio = `${lado / 2}px ${lado / 2}px 0 ${lado / 2}px`;
  return `${cabeca(t.titulo)}
<div style="position:relative; width:${W}px; height:${H}px; background:${CREME}; overflow:hidden; font-family:Montserrat, sans-serif;">
${petala(360, 'left:-150px; bottom:-140px', VERMELHO, 0.18, 90)}
${petala(300, 'right:-120px; top:420px', VERMELHO, 0.14, 180)}
<div style="position:absolute; left:${x + 28}px; top:${y + 28}px; width:${lado}px; height:${lado}px; box-sizing:border-box; border:4px solid ${VERMELHO}; border-radius:${raio};"></div>
<img src="{{fundo}}" style="position:absolute; left:${x}px; top:${y}px; width:${lado}px; height:${lado}px; object-fit:cover; display:block; border-radius:${raio}; background:#e9dccb; box-shadow:0 18px 40px rgba(35,31,32,.12);" onerror="this.src='${fotoVazia}'"/>
<img src="{{logo}}" alt="" style="{{logo:estilo}}"/>
<!--fld:selo--><div class="pd-bloco" style="position:absolute; left:80px; top:80px;">${pilula('{{selo}}', VERMELHO, '#f7efe3')}</div><!--/fld:selo-->
<div style="position:absolute; left:90px; top:${y + lado + 76}px; width:900px; text-align:center; color:${VERMELHO};">
<!--fld:chamada--><div class="pd-vazio" style="font-size:25px; font-weight:400; letter-spacing:3px; text-transform:uppercase; margin-bottom:18px;">{{chamada}}</div><!--/fld:chamada-->
<div style="font-size:54px; font-weight:300; line-height:1.12;">{{titulo}}</div>
<div class="pd-vazio" style="margin:20px auto 0; max-width:820px; font-size:26px; font-weight:300; line-height:1.5; color:#9b4a57; white-space:pre-line;">{{texto}}</div>
<!--fld:botao--><div class="pd-bloco" style="margin-top:28px;">${pilula('{{botao}}', VERMELHO, '#f7efe3', 20)}</div><!--/fld:botao-->
</div>
</div>
</body>
</html>`;
}

// ── Esqueleto 2: tipográfico ─────────────────────────────────────────────────
type Tema = 'vermelho' | 'creme' | 'grafite';
const TEMAS: Record<Tema, { fundo: string; texto: string; destaque: string; suave: string; petala: string }> = {
  vermelho: { fundo: VERMELHO, texto: '#ffffff', destaque: '#ffffff', suave: 'rgba(255,255,255,.82)', petala: '#ffffff' },
  creme: { fundo: CREME, texto: VERMELHO, destaque: VERMELHO, suave: '#9b4a57', petala: VERMELHO },
  grafite: { fundo: GRAFITE, texto: '#ffffff', destaque: VERMELHO, suave: 'rgba(255,255,255,.78)', petala: VERMELHO },
};

function tipografico(t: { titulo: string; tema: Tema }): string {
  const c = TEMAS[t.tema];
  const info = (n: number) =>
    `<!--fld:info${n}--><div class="pd-vazio" style="display:inline-block; margin:0 14px 14px 0; padding:14px 26px; border-radius:18px 18px 0 18px; border:2px solid ${c.destaque}; color:${c.texto}; font-size:27px; font-weight:500;">{{info${n}}}</div><!--/fld:info${n}-->`;
  return `${cabeca(t.titulo)}
<div style="position:relative; width:${W}px; height:${H}px; background:${c.fundo}; overflow:hidden; font-family:Montserrat, sans-serif;">
${petala(520, 'top:-200px; right:-170px', c.petala, 0.28)}
${petala(380, 'bottom:-130px; left:-140px', c.petala, 0.22, 90)}
${petala(220, 'top:430px; right:-90px', c.petala, 0.16, 180)}
<img src="{{logo}}" alt="" style="{{logo:estilo}}"/>
<!--fld:selo--><div class="pd-bloco" style="position:absolute; left:96px; top:110px;">${pilula('{{selo}}', t.tema === 'vermelho' ? '#ffffff' : VERMELHO, t.tema === 'vermelho' ? VERMELHO : '#ffffff')}</div><!--/fld:selo-->
<div style="position:absolute; left:96px; top:250px; width:880px; color:${c.texto};">
<div style="font-size:104px; font-weight:800; line-height:1.0; letter-spacing:-1px; white-space:pre-line;">{{titulo}}</div>
<div class="pd-vazio" style="margin-top:34px; font-size:34px; font-weight:300; line-height:1.4; color:${c.suave}; white-space:pre-line; max-width:820px;">{{texto}}</div>
<div style="margin-top:44px;">${info(1)}${info(2)}${info(3)}</div>
<!--fld:botao--><div class="pd-bloco" style="margin-top:26px;">${pilula('{{botao}}', t.tema === 'vermelho' ? '#ffffff' : VERMELHO, t.tema === 'vermelho' ? VERMELHO : '#ffffff', 22)}</div><!--/fld:botao-->
</div>
</div>
</body>
</html>`;
}

const camposTipografico = (
  d: { selo: string; titulo: string; texto: string; info: [string, string, string]; botao: string; rotulos?: [string, string, string] },
  logoBranco: boolean,
): TemplateField[] => {
  const r = d.rotulos ?? ['Informação 1 (ex.: data)', 'Informação 2 (ex.: horário)', 'Informação 3 (ex.: local)'];
  return [
    { id: 'selo', label: 'Etiqueta (opcional)', placeholder: '{{selo}}', defaultValue: d.selo, maxLength: 24 },
    { id: 'titulo', label: 'Título', placeholder: '{{titulo}}', defaultValue: d.titulo, inputType: 'textarea', maxLength: 40 },
    { id: 'texto', label: 'Texto', placeholder: '{{texto}}', defaultValue: d.texto, inputType: 'textarea', maxLength: 170 },
    { id: 'info1', label: `${r[0]} (opcional)`, placeholder: '{{info1}}', defaultValue: d.info[0], maxLength: 30 },
    { id: 'info2', label: `${r[1]} (opcional)`, placeholder: '{{info2}}', defaultValue: d.info[1], maxLength: 30 },
    { id: 'info3', label: `${r[2]} (opcional)`, placeholder: '{{info3}}', defaultValue: d.info[2], maxLength: 40 },
    { id: 'botao', label: 'Botão (opcional)', placeholder: '{{botao}}', defaultValue: d.botao, maxLength: 32 },
    campoLogo(logoBranco, 96, 1170, 220),
  ];
};

// ── Esqueleto 3: lista ───────────────────────────────────────────────────────
function lista(t: { titulo: string }): string {
  return `${cabeca(t.titulo)}
<div style="position:relative; width:${W}px; height:__ALTURA__px; background:${CREME}; overflow:hidden; font-family:Montserrat, sans-serif;">
${petala(460, 'top:-180px; right:-160px', VERMELHO, 0.22)}
${petala(320, 'bottom:-120px; left:-130px', '#DB9828', 0.3, 90)}
<img src="{{logo}}" alt="" style="{{logo:estilo}}"/>
<div style="position:absolute; left:96px; top:120px; width:888px; color:${VERMELHO};">
<!--fld:selo--><div class="pd-bloco" style="margin-bottom:28px;">${pilula('{{selo}}', VERMELHO, '#ffffff')}</div><!--/fld:selo-->
<div style="font-size:78px; font-weight:800; line-height:1.02; white-space:pre-line;">{{titulo}}</div>
<div class="pd-vazio" style="margin-top:18px; font-size:30px; font-weight:300; line-height:1.4; color:#9b4a57;">{{texto}}</div>
<div style="margin-top:44px; min-height:__LISTA__px;"><!--ITENS--></div>
<div class="pd-vazio" style="margin-top:30px; font-size:26px; font-weight:500; color:${GRAFITE};">{{rodape}}</div>
</div>
</div>
</body>
</html>`;
}

const itemDaLista = (fundo: string, cor: string, borda: string) =>
  `<div style="display:flex; align-items:center; margin-bottom:16px; padding:20px 30px; border-radius:22px 22px 0 22px; background:${fundo}; color:${cor}; ${borda} font-size:30px; font-weight:500; line-height:1.25;">{{text}}</div>`;

const repetirLista = (itemLabel: string, addLabel: string, iniciais: string[]): RepeatConfig => ({
  token: '<!--ITENS-->',
  canvasHeightToken: '__ALTURA__',
  cardHeightToken: '__LISTA__',
  itemLabel,
  addLabel,
  defaultVariant: 'item',
  baseCount: 7,
  step: 92,
  baseCanvasHeight: H,
  baseCardHeight: 0,
  variants: [
    { id: 'item', label: 'Normal', html: itemDaLista('#ffffff', GRAFITE, 'border:2px solid rgba(193,32,48,.25);') },
    { id: 'destaque', label: 'Destaque', html: itemDaLista(VERMELHO, '#ffffff', '') },
  ],
  initial: iniciais.map((text, i) => ({ text, variant: i === 0 ? 'destaque' : 'item' })),
});

const camposLista = (d: { selo: string; titulo: string; texto: string; rodape: string }): TemplateField[] => [
  { id: 'selo', label: 'Etiqueta (opcional)', placeholder: '{{selo}}', defaultValue: d.selo, maxLength: 24 },
  { id: 'titulo', label: 'Título', placeholder: '{{titulo}}', defaultValue: d.titulo, inputType: 'textarea', maxLength: 40 },
  { id: 'texto', label: 'Texto (opcional)', placeholder: '{{texto}}', defaultValue: d.texto, maxLength: 90 },
  { id: 'rodape', label: 'Rodapé (opcional)', placeholder: '{{rodape}}', defaultValue: d.rodape, maxLength: 70 },
  campoLogo(false, 760, 1220, 220),
];

// ── Os modelos ───────────────────────────────────────────────────────────────
const molde = (
  id: string,
  name: string,
  category: string,
  html: string,
  fields: TemplateField[],
  extra: Partial<PureDesignTemplate> = {},
): PureDesignTemplate => ({
  id,
  name,
  category,
  // Miniatura gerada da própria arte (padrão), em public/images/pure-design/<id>.jpg.
  thumbnail: `/images/pure-design/${id}.jpg`,
  width: W,
  height: H,
  html,
  fields,
  ...extra,
});

// ── Coringas (refeitos em HTML, 17/11/2026) ─────────────────────────────────
// Genéricos para qualquer assunto que não tenha modelo próprio. Mesma família
// visual: fundo creme, título leve com trecho em negrito (**assim**), texto,
// etiqueta e botão opcionais, logo arrastável. Sem foto, o P da marca entra
// grande no canto; com foto, a foto vai numa moldura em pétala.
const P_DA_MARCA = '/images/pure-design/pure-p.png';

function coringa(fotos: 0 | 1 | 2): string {
  const blocoTexto = (top: number, largura: number, tamTitulo: number, tamTexto: number) => `
<div style="position:absolute; left:96px; top:${top}px; width:${largura}px; color:${VERMELHO};">
<!--fld:selo--><div class="pd-bloco" style="margin-bottom:${fotos ? 30 : 44}px;">${pilula('{{selo}}', VERMELHO, '#f7efe3')}</div><!--/fld:selo-->
<div style="font-size:${tamTitulo}px; font-weight:300; line-height:1.06; letter-spacing:-1px; white-space:pre-line;">{{titulo}}</div>
<div class="pd-vazio" style="margin-top:${fotos ? 22 : 34}px; font-size:${tamTexto}px; font-weight:300; line-height:1.45; color:${GRAFITE}; white-space:pre-line;">{{texto}}</div>
<!--fld:botao--><div class="pd-bloco" style="margin-top:${fotos ? 28 : 40}px;">${pilula('{{botao}}', VERMELHO, '#f7efe3', 20)}</div><!--/fld:botao-->
</div>`;

  const foto = (id: string, x: number, largura: number, raio: string) =>
    `<img src="{{${id}}}" style="position:absolute; left:${x}px; top:60px; width:${largura}px; height:700px; object-fit:cover; display:block; border-radius:${raio}; background:#e9dccb;" onerror="this.src='${fotoVazia}'"/>`;

  const miolo =
    fotos === 0
      ? `<img src="${P_DA_MARCA}" alt="" style="position:absolute; right:-150px; bottom:-210px; width:560px; height:auto;"/>
${petala(300, 'top:-120px; right:-110px', VERMELHO, 0.2)}
${blocoTexto(150, 840, 104, 36)}`
      : fotos === 1
        ? `${foto('foto', 60, 960, '64px 64px 0 64px')}
${petala(260, 'bottom:-110px; right:-100px', VERMELHO, 0.2, 90)}
${blocoTexto(820, 880, 68, 30)}`
        : `${foto('foto1', 60, 470, '64px 64px 64px 0')}
${foto('foto2', 550, 470, '64px 64px 0 64px')}
${petala(260, 'bottom:-110px; right:-100px', VERMELHO, 0.2, 90)}
${blocoTexto(820, 880, 68, 30)}`;

  return `${cabeca(fotos ? 'Coringa com foto' : 'Coringa só texto')}
<div style="position:relative; width:${W}px; height:${H}px; background:${CREME}; overflow:hidden; font-family:Montserrat, sans-serif;">
${miolo}
<img src="{{logo}}" alt="" style="{{logo:estilo}}"/>
</div>
</body>
</html>`;
}

const camposCoringa = (fotos: 0 | 1 | 2): TemplateField[] => {
  const campoFoto = (id: string, label: string): TemplateField => ({
    id,
    label,
    placeholder: `{{${id}}}`,
    defaultValue: fotoVazia,
    inputType: 'image',
    obrigatoria: true,
  });
  return [
    ...(fotos === 1 ? [campoFoto('foto', 'Foto (obrigatória)')] : []),
    ...(fotos === 2 ? [campoFoto('foto1', 'Foto da esquerda (obrigatória)'), campoFoto('foto2', 'Foto da direita (obrigatória)')] : []),
    { id: 'selo', label: 'Etiqueta (opcional)', placeholder: '{{selo}}', defaultValue: 'Novidade', maxLength: 24 },
    {
      id: 'titulo',
      label: 'Título (use **assim** para negrito)',
      placeholder: '{{titulo}}',
      defaultValue: fotos ? 'Um recado **especial**\npara você.' : 'Um recado\n**especial**\npara você.',
      inputType: 'textarea',
      maxLength: fotos ? 50 : 45,
    },
    {
      id: 'texto',
      label: 'Texto (opcional)',
      placeholder: '{{texto}}',
      defaultValue: fotos
        ? 'Escreva aqui o recado para os seus alunos, em até três linhas.'
        : 'Escreva aqui o recado para os seus alunos, em poucas linhas. Use este modelo para qualquer assunto.',
      inputType: 'textarea',
      maxLength: fotos ? 120 : 150,
    },
    { id: 'botao', label: 'Botão (opcional)', placeholder: '{{botao}}', defaultValue: '', maxLength: 30 },
    fotos ? campoLogo(false, 800, 1240, 190) : campoLogo(false, 96, 1200, 220),
  ];
};

const CORINGAS: PureDesignTemplate[] = [
  molde('coringa-texto', 'Coringa — Só texto', 'Coringas', coringa(0), camposCoringa(0), { coringa: true }),
  molde('coringa-foto', 'Coringa — Com foto', 'Coringas', coringa(1), camposCoringa(1), { coringa: true }),
  molde('coringa-duas-fotos', 'Coringa — Duas fotos', 'Coringas', coringa(2), camposCoringa(2), { coringa: true }),
];

export const MODELOS_NOVOS: PureDesignTemplate[] = [
  ...CORINGAS,
  // Datas comemorativas
  molde(
    'natal-boas-festas',
    'Natal e Ano Novo — Boas festas (sem foto)',
    'Datas comemorativas',
    tipografico({ titulo: 'Boas festas', tema: 'vermelho' }),
    camposTipografico(
      {
        selo: 'Boas festas',
        titulo: 'Que o novo ano\nseja leve.',
        texto: 'Obrigado por fazer parte da nossa história em 2026. A equipe da unidade deseja um Natal cheio de afeto e um ano novo em movimento.',
        info: ['', '', ''],
        botao: '',
      },
      true,
    ),
  ),
  molde(
    'natal-com-foto',
    'Natal e Ano Novo — Com foto da equipe',
    'Datas comemorativas',
    cartaoSobreFoto({ titulo: 'Natal com foto' }),
    camposCartao({
      fundo: 'Foto da equipe ou do estúdio (obrigatória)',
      selo: 'Feliz Natal',
      chamada: 'de toda a equipe para você',
      titulo: 'Boas festas e um ano novo em movimento.',
      texto: 'Obrigado por cada aula, cada conquista e cada sorriso em 2026.',
      botao: '',
    }),
  ),

  // Aulas e eventos
  molde(
    'aulao-evento',
    'Aulão / evento na unidade',
    'Aulas e eventos',
    tipografico({ titulo: 'Aulão', tema: 'vermelho' }),
    camposTipografico(
      {
        selo: 'Aulão do mês',
        titulo: 'Aulão de\nnovembro',
        texto: 'Uma aula especial para movimentar a comunidade. Traga uma amiga e venha viver a melhor hora do seu dia.',
        info: ['Sábado, 29/11', '9h', 'Na unidade'],
        botao: 'Garanta sua vaga',
        rotulos: ['Data', 'Horário', 'Local'],
      },
      true,
    ),
  ),
  molde(
    'grade-horarios',
    'Grade de horários da semana',
    'Aulas e eventos',
    lista({ titulo: 'Grade de horários' }),
    camposLista({
      selo: 'Grade de aulas',
      titulo: 'Horários\nda semana',
      texto: 'Escolha o seu e garanta a melhor hora do seu dia.',
      rodape: 'Agende pelo WhatsApp (11) 99999-9999',
    }),
    {
      repeat: repetirLista('Dia e horários', 'Adicionar dia', [
        'Segunda · 7h · 8h · 12h · 18h · 19h',
        'Terça · 7h · 8h · 18h · 19h',
        'Quarta · 7h · 8h · 12h · 18h · 19h',
        'Quinta · 7h · 8h · 18h · 19h',
        'Sexta · 7h · 8h · 12h · 18h',
        'Sábado · 8h · 9h · 10h',
      ]),
    },
  ),

  // Atrair alunos
  molde(
    'aula-experimental-foto',
    'Aula experimental (com foto)',
    'Atrair alunos',
    cartaoSobreFoto({ titulo: 'Aula experimental' }),
    camposCartao({
      fundo: 'Foto do estúdio ou de uma aula (obrigatória)',
      selo: 'Aula experimental',
      chamada: 'venha conhecer',
      titulo: 'A melhor hora do seu dia começa aqui.',
      texto: 'Agende sua aula experimental e sinta o método Pure na prática.',
      botao: 'Agende pelo WhatsApp',
    }),
  ),
  molde(
    'aula-experimental-texto',
    'Aula experimental (sem foto)',
    'Atrair alunos',
    tipografico({ titulo: 'Aula experimental', tema: 'creme' }),
    camposTipografico(
      {
        selo: 'Aula experimental',
        titulo: 'Venha\nconhecer.',
        texto: 'Sua primeira aula na Pure é para sentir o método na prática, no seu ritmo.',
        info: ['Agende pelo WhatsApp', '(11) 99999-9999', ''],
        botao: 'Quero agendar',
        rotulos: ['Informação 1', 'Contato', 'Informação 3'],
      },
      false,
    ),
  ),
  molde(
    'indique-amigo',
    'Indique um amigo',
    'Atrair alunos',
    tipografico({ titulo: 'Indique um amigo', tema: 'creme' }),
    camposTipografico(
      {
        selo: 'Indique Pilates',
        titulo: 'Indique\numa amiga.',
        texto: 'Quem indica e quem chega ganham. Pergunte na recepção como funciona o programa de indicação da unidade.',
        info: ['', '', ''],
        botao: 'Fale com a recepção',
      },
      false,
    ),
  ),
  molde(
    'black-friday-unidade',
    'Black Friday da unidade (planos)',
    'Atrair alunos',
    tipografico({ titulo: 'Black Friday', tema: 'grafite' }),
    camposTipografico(
      {
        selo: 'Black Friday',
        titulo: 'Black\nFriday',
        texto: 'Condição especial para começar o Pilates na unidade. Consulte as condições na recepção.',
        info: ['Até 30/11', '', ''],
        botao: 'Garanta a sua',
        rotulos: ['Validade', 'Informação 2', 'Informação 3'],
      },
      true,
    ),
  ),

  // Avisos da unidade
  molde(
    'mudanca-horario',
    'Mudança de horário / aula cancelada',
    'Avisos da unidade',
    tipografico({ titulo: 'Aviso', tema: 'creme' }),
    camposTipografico(
      {
        selo: 'Aviso',
        titulo: 'Mudança\nde horário',
        texto: 'Por causa de uma manutenção, as aulas do período da manhã vão começar mais tarde. Contamos com a sua compreensão!',
        info: ['Quinta, 20/11', 'A partir das 10h', ''],
        botao: '',
        rotulos: ['Data', 'Novo horário', 'Informação 3'],
      },
      false,
    ),
  ),

  // Equipe
  molde(
    'novo-instrutor',
    'Novo instrutor na equipe',
    'Equipe',
    retratoEmoldurado({ titulo: 'Novo instrutor' }),
    // Mesmos campos do cartão, mas com o logo colorido (o fundo aqui é creme).
    camposCartao({
      fundo: 'Foto do instrutor(a) (obrigatória)',
      selo: 'Novo na equipe',
      chamada: 'dê as boas-vindas',
      titulo: 'Conheça a Camila, nossa nova instrutora.',
      texto: 'Formada em Educação Física, com formação completa em Pilates. Vem com muita energia para as suas aulas!',
      botao: '',
    }).map((f) => (f.id === 'logo' ? campoLogo(false, 790, 84, 210) : f)),
  ),

  // Alunos e comunidade
  molde(
    'boas-vindas-aluno',
    'Boas-vindas a aluno novo',
    'Alunos e comunidade',
    tipografico({ titulo: 'Boas-vindas', tema: 'vermelho' }),
    camposTipografico(
      {
        selo: 'Bem-vinda',
        titulo: 'Seja bem-vinda,\nMariana!',
        texto: 'Que bom ter você com a gente. Que as suas aulas sejam a melhor hora do seu dia.',
        info: ['', '', ''],
        botao: '',
      },
      true,
    ),
  ),
  molde(
    'aniversariantes-mes',
    'Aniversariantes do mês',
    'Alunos e comunidade',
    lista({ titulo: 'Aniversariantes' }),
    camposLista({
      selo: 'Parabéns',
      titulo: 'Aniversariantes\nde novembro',
      texto: 'Celebramos cada um de vocês!',
      rodape: '',
    }),
    {
      repeat: repetirLista('Aniversariante', 'Adicionar aniversariante', [
        '03/11 · Ana Paula',
        '09/11 · Carlos Eduardo',
        '15/11 · Juliana',
        '22/11 · Renata',
      ]),
    },
  ),
];

/** Palavras do pedido que apontam para cada modelo novo (minúsculas, sem acento). */
export const PALAVRAS_MODELOS_NOVOS: Record<string, string[]> = {
  'natal-boas-festas': ['natal', 'ano novo', 'boas festas', 'fim de ano', 'reveillon', 'feliz natal'],
  'natal-com-foto': ['natal', 'ano novo', 'boas festas', 'fim de ano', 'foto da equipe', 'feliz natal'],
  'aulao-evento': ['aulao', 'evento', 'workshop', 'aula especial', 'aula aberta', 'sorteio', 'encontro'],
  'grade-horarios': ['grade', 'horarios', 'horario das aulas', 'agenda de aulas', 'turmas'],
  'aula-experimental-foto': ['aula experimental', 'experimental', 'conhecer', 'primeira aula', 'agende'],
  'aula-experimental-texto': ['aula experimental', 'experimental', 'conhecer', 'primeira aula', 'agende'],
  'indique-amigo': ['indique', 'indicacao', 'indicar', 'amiga', 'amigo', 'traga'],
  'black-friday-unidade': ['black friday', 'black', 'condicao especial', 'promocao', 'matricula', 'planos'],
  'mudanca-horario': ['mudanca', 'horario', 'cancelad', 'manutencao', 'reposicao', 'nao havera aula'],
  'novo-instrutor': ['novo instrutor', 'nova instrutora', 'novo na equipe', 'chegou na equipe', 'apresentar'],
  'boas-vindas-aluno': ['boas-vindas', 'boas vindas', 'bem-vind', 'bem vind', 'aluno novo', 'aluna nova'],
  'aniversariantes-mes': ['aniversariantes', 'aniversariante do mes', 'parabens aos alunos', 'aniversario dos alunos'],
};

/** O que é cada modelo novo, para o assistente decidir. */
export const DICAS_MODELOS_NOVOS: Record<string, string> = {
  'natal-boas-festas': 'Mensagem de Natal / Ano Novo / boas festas da unidade, sem foto (fundo vermelho).',
  'natal-com-foto': 'Mensagem de Natal / Ano Novo com foto da equipe ou do estúdio (obrigatória).',
  'aulao-evento': 'Aulão do mês, aula aberta, workshop ou evento na unidade: data, horário, local e botão.',
  'grade-horarios': 'Grade de horários de aulas da semana: uma linha por dia, com os horários; rodapé com contato.',
  'aula-experimental-foto': 'Convite para aula experimental COM foto do estúdio (obrigatória).',
  'aula-experimental-texto': 'Convite para aula experimental SEM foto (tipográfico), com contato.',
  'indique-amigo': 'Programa de indicação (Indique Pilates): convite para o aluno trazer alguém. Não invente o prêmio.',
  'black-friday-unidade': 'Black Friday da UNIDADE (planos/matrícula), fundo escuro. Não invente preço nem desconto.',
  'mudanca-horario': 'Aviso de mudança de horário, aula cancelada, manutenção (não é feriado).',
  'novo-instrutor': 'Apresentar instrutor(a) novo(a) na equipe, com foto (obrigatória), nome e formação.',
  'boas-vindas-aluno': 'Boas-vindas a um aluno ou aluna nova, com o nome.',
  'aniversariantes-mes': 'Lista dos alunos aniversariantes do mês (data · nome).',
};
