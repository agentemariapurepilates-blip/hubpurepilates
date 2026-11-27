import { DICAS_MODELOS_NOVOS, MODELOS_NOVOS, PALAVRAS_MODELOS_NOVOS } from './pureDesignModelosNovos';
import { DICAS_FERIADOS_2027, FERIADOS_2027, PALAVRAS_FERIADOS_2027 } from './pureDesignFeriados2027';
import { DICAS_RECESSO, PALAVRAS_RECESSO, RECESSO } from './pureDesignRecesso';

export interface TemplateField {
  id: string;
  label: string;
  placeholder: string;
  defaultValue: string;
  inputType?: 'input' | 'textarea' | 'image' | 'logo';
  maxLength?: number;
  /** Foto obrigatória: o editor não deixa baixar sem ela e o assistente pede antes de gerar. */
  obrigatoria?: boolean;
  /**
   * Só para inputType 'logo': de quais unidades da biblioteca "Assets de marca"
   * o logo pode vir (ex.: ['Pure Store'] permite o da loja e o da Coleção Move).
   * O assistente escolhe; no editor, só o time troca o logo.
   */
  unidadesLogo?: string[];
  /**
   * Só para inputType 'logo': onde o logo fica e de que tamanho, por padrão.
   * No HTML, o estilo do <img> vem do token {{<id>:estilo}}, calculado a partir
   * disto e dos ajustes do editor (valores "<id>__canto", "__escala", "__mx", "__my").
   */
  logoCaixa?: LogoCaixa;
}

export interface GaleriaConfig {
  /** Token no HTML trocado pelas molduras montadas. */
  token: string;
  /** Campos de foto da galeria, em ordem (a primeira é a principal). */
  campos: string[];
  x: number;
  y: number;
  largura: number;
  altura: number;
  /** Espaço entre as fotos, em px. */
  espaco: number;
  /** Raio dos cantos, em px. */
  raio: number;
  /** Imagem da moldura enquanto a pessoa não sobe a foto. */
  fotoVazia: string;
}

/**
 * Monta as molduras da galeria conforme quantas fotos ficaram:
 * 1 = uma grande; 2 = duas colunas iguais; 3 = uma grande à esquerda e duas
 * empilhadas à direita (o desenho original do Canva).
 */
export function montarGaleria(g: GaleriaConfig, values: Record<string, string>, removed?: ReadonlySet<string>): string {
  const ativos = g.campos.filter((c) => !removed?.has(c));
  const { x, y, largura: w, altura: h, espaco: e } = g;
  let caixas: [number, number, number, number][] = [];
  if (ativos.length === 1) caixas = [[x, y, w, h]];
  else if (ativos.length === 2) {
    const c = (w - e) / 2;
    caixas = [[x, y, c, h], [x + c + e, y, c, h]];
  } else if (ativos.length >= 3) {
    const grande = Math.round(w * 0.6);
    const lado = w - grande - e;
    const meia = (h - e) / 2;
    caixas = [[x, y, grande, h], [x + grande + e, y, lado, meia], [x + grande + e, y + meia + e, lado, meia]];
  }
  return ativos
    .slice(0, caixas.length)
    .map((campo, i) => {
      const [l, t, cw, ch] = caixas[i];
      const src = values[campo] || g.fotoVazia;
      return `<div data-foto="${campo}" style="position:absolute; left:${l}px; top:${t}px; width:${cw}px; height:${ch}px; border-radius:${g.raio}px; overflow:hidden; box-shadow:0 10px 28px rgba(60,40,20,0.12);"><img src="${src}" style="${estiloDoRecorte(campo, values)}" onerror="this.src='${g.fotoVazia}'"/></div>`;
    })
    .join('\n');
}

/** Enquadramento de uma foto: zoom (>= 1) e ponto de foco em % (0 a 100). */
export function recorteDaFoto(id: string, values: Record<string, string>) {
  const num = (v: string | undefined, padrao: number) => (v !== undefined && v !== '' && !Number.isNaN(Number(v)) ? Number(v) : padrao);
  return {
    zoom: Math.min(4, Math.max(1, num(values[`${id}__zoom`], 1))),
    x: Math.min(100, Math.max(0, num(values[`${id}__fx`], 50))),
    y: Math.min(100, Math.max(0, num(values[`${id}__fy`], 50))),
  };
}

/** Estilo do <img> recortado: cobre a moldura, com foco e zoom. */
export function estiloDoRecorte(id: string, values: Record<string, string>): string {
  const r = recorteDaFoto(id, values);
  return (
    `width:100%; height:100%; object-fit:cover; display:block; object-position:${r.x}% ${r.y}%; ` +
    `transform:scale(${r.zoom}); transform-origin:${r.x}% ${r.y}%;`
  );
}

/**
 * Troca cada <img src="{{foto}}" style="…"> de campo de foto por uma moldura
 * (<div> com a caixa e o estilo originais, overflow escondido) e, dentro, a foto
 * com o enquadramento ajustável. A moldura leva data-foto, que é por onde o
 * editor deixa arrastar e dar zoom direto na arte.
 */
function emoldurarFotos(html: string, template: PureDesignTemplate, values: Record<string, string>): string {
  for (const f of template.fields) {
    // Logo: marcado para o editor deixar arrastar e redimensionar na arte.
    if (f.inputType === 'logo') {
      html = html.split(`<img src="{{${f.id}}}"`).join(`<img data-logo="${f.id}" src="{{${f.id}}}"`);
      continue;
    }
    if (f.inputType !== 'image') continue;
    const re = new RegExp(`<img src="\\{\\{${f.id}\\}\\}"([^>]*?)style="([^"]*)"([^>]*)/?>`, 'g');
    html = html.replace(
      re,
      (_m, antes: string, estilo: string, depois: string) =>
        `<div data-foto="${f.id}" style="${estilo}; overflow:hidden;"><img src="{{${f.id}}}"${antes}style="${estiloDoRecorte(f.id, values)}"${depois}/></div>`,
    );
  }
  return html;
}

export type CantoLogo = 'sup-esq' | 'sup-dir' | 'inf-esq' | 'inf-dir';

/**
 * Posição e tamanho padrão do logo no modelo. O logo é livre: no editor ele é
 * arrastado para qualquer lugar e redimensionado (valores "<id>__x", "__y",
 * "__escala"); os cantos são só atalhos.
 */
export interface LogoCaixa {
  /** Canto esquerdo e topo do logo, em px da arte. */
  x: number;
  y: number;
  /** Largura do logo com escala 1, em px. */
  largura: number;
  /** Altura ÷ largura do arquivo padrão (para calcular os cantos). */
  proporcao: number;
  /** Filtro CSS fixo (ex.: deixar o logo branco sobre fundo escuro). */
  filtro?: string;
}

const numero = (v: string | undefined, padrao: number) =>
  v !== undefined && v !== '' && !Number.isNaN(Number(v)) ? Number(v) : padrao;

/** Posição e escala atuais do logo (padrão do modelo + ajustes). */
export function posicaoDoLogo(id: string, caixa: LogoCaixa, values: Record<string, string>) {
  return {
    x: numero(values[`${id}__x`], caixa.x),
    y: numero(values[`${id}__y`], caixa.y),
    escala: Math.min(3, Math.max(0.3, numero(values[`${id}__escala`], 1))),
  };
}

/** Estilo do <img> do logo: posição livre e tamanho, com os ajustes do editor. */
export function estiloDoLogo(id: string, caixa: LogoCaixa, values: Record<string, string>): string {
  const p = posicaoDoLogo(id, caixa, values);
  return (
    `position:absolute; left:${Math.round(p.x)}px; top:${Math.round(p.y)}px; width:${Math.round(caixa.largura * p.escala)}px; ` +
    `height:auto; display:block;${caixa.filtro ? ` filter:${caixa.filtro};` : ''}`
  );
}

/** x e y para encostar o logo num canto da arte, com margem. */
export function cantoDoLogo(
  canto: CantoLogo,
  caixa: LogoCaixa,
  escala: number,
  largura: number,
  altura: number,
  margem = 60,
): { x: number; y: number } {
  const w = caixa.largura * escala;
  const h = w * caixa.proporcao;
  return {
    x: canto.endsWith('esq') ? margem : largura - margem - w,
    y: canto.startsWith('sup') ? margem : altura - margem - h,
  };
}

/**
 * Texto de um campo como entra na arte: **trecho** vira negrito e o ajuste de
 * tamanho ("<id>__tam", 0,7 a 1,4) escala o texto em relação ao do modelo.
 */
export function textoDoCampo(id: string, valor: string, values: Record<string, string>): string {
  if (!valor) return valor;
  let t = valor.replace(/\*\*(.+?)\*\*/gs, '<strong style="font-weight:700;">$1</strong>');
  const tam = Math.min(1.4, Math.max(0.7, numero(values[`${id}__tam`], 1)));
  if (tam !== 1) t = `<span style="font-size:${tam}em;">${t}</span>`;
  return t;
}

/** Uma linha da tabela editável (ex.: Pure Store — produto + preço). */
export interface TableRow {
  item: string;
  preco: string;
}

/**
 * Descreve uma tabela de linhas dinâmicas (adicionar/excluir sem limite).
 * O usuário escolhe o item num dropdown do catálogo e digita o preço.
 */
export interface TableConfig {
  /** Token no HTML trocado pelas linhas geradas. */
  rowsToken: string;
  /** Catálogo de produtos do dropdown (já ordenado). */
  catalog: string[];
  /** Texto do item quando nada foi escolhido. */
  placeholder: string;
  /** Valor default do preço (só números; o "R$" já está no layout). */
  priceDefault: string;
  /** Quantas linhas começam preenchidas. */
  initialRows: number;
  /** HTML de UMA linha, com tokens {{bg}}, {{item}} e {{preco}}. */
  rowHtml: string;
  /** Cores do zebrado (linha par / ímpar). */
  zebra: [string, string];
  /** Altura de cada linha em px (o canvas cresce com o nº de linhas). */
  rowHeight: number;
  /** Altura do canvas SEM nenhuma linha (header + cabeçalho + PIX + rodapé). */
  baseHeight: number;
  /** Altura do bloco PIX — subtraída do canvas quando o PIX é removido. */
  pixHeight: number;
}

/** Um item da lista dinâmica de "pills" (ex.: datas do aviso de feriado). */
export interface RepeatItem {
  text: string;
  /** id da variante visual escolhida (ex.: 'fechado' | 'aberto'). */
  variant: string;
}

/**
 * Lista de pills que o usuário pode adicionar / duplicar / excluir (ex.: as
 * datas do "Aviso de Feriado"). Cada item vira um pill; a variante define a
 * cor/estilo. O canvas e o card crescem `step` px por item além de `baseCount`.
 */
export interface RepeatConfig {
  /** Token no HTML trocado pelos pills gerados. */
  token: string;
  /** Token da altura do canvas (cresce com o nº de itens). */
  canvasHeightToken: string;
  /** Token da altura do card (cresce com o nº de itens). */
  cardHeightToken: string;
  /** Rótulo da seção / de um item (ex.: "Data"). */
  itemLabel: string;
  /** Rótulo do botão de adicionar (ex.: "Adicionar data"). */
  addLabel: string;
  /** Variante default de itens novos/adicionados. */
  defaultVariant: string;
  /** Nº de itens que o layout-base já acomoda. */
  baseCount: number;
  /** Altura (px) adicionada ao canvas e ao card por item além de baseCount. */
  step: number;
  /** Altura do canvas com baseCount itens. */
  baseCanvasHeight: number;
  /** Altura do card com baseCount itens. */
  baseCardHeight: number;
  /** Variantes visuais — HTML de UM pill, com o token {{text}}. */
  variants: { id: string; label: string; html: string }[];
  /** Itens iniciais. */
  initial: RepeatItem[];
}

export interface PureDesignTemplate {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  width: number;
  height: number;
  html: string;
  fields: TemplateField[];
  /** Presente só em templates com tabela de linhas dinâmicas (Pure Store). */
  table?: TableConfig;
  /** Presente só em templates com lista dinâmica de pills (Aviso de Feriado). */
  repeat?: RepeatConfig;
  /**
   * Modelo "coringa": genérico o bastante para qualquer assunto. O assistente do
   * Pure Design usa um coringa quando nenhum modelo específico combina com o
   * pedido (ex.: Natal, Black Friday, aula aberta), escrevendo o texto para o tema.
   */
  coringa?: boolean;
  /**
   * Galeria de fotos que se reorganiza conforme a quantidade (1 a N): as fotos
   * excluídas no editor (ou que o assistente não usou) saem e as outras ocupam o
   * espaço. Ver montarGaleria.
   */
  galeria?: GaleriaConfig;
  /**
   * Palavras que, no pedido, apontam para este modelo (minúsculas, sem acento).
   * O assistente do Pure Design procura essas palavras e é obrigado a preferir
   * os modelos que combinam antes de recorrer a um coringa. Ver PALAVRAS_CHAVE.
   */
  palavrasChave?: string[];
  /** Quando usar este modelo, em uma frase para o assistente (ex.: "inauguração sem foto"). */
  dica?: string;
}

const sejaInstrutorHTML = (bgUrl: string) => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Seja Instrutor</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
</head>
<body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#f0f0f0;">
<div style="position:relative; width:1080px; height:1440px; background:#e8e8e8; background-image:url('${bgUrl}'); background-size:cover; background-position:center; overflow:hidden; font-family:Montserrat, sans-serif;">
<div style="position:absolute; right:80px; top:120px; width:700px; text-align:right;">
<h1 style="font-size:100px; font-weight:800; color:#1a1a1a; letter-spacing:6px; margin:0; line-height:1;">{{titulo1}}</h1>
<h1 style="font-size:84px; font-weight:800; color:#c41230; letter-spacing:6px; margin:0; line-height:1;">{{titulo2}}</h1>
<p style="font-size:40px; font-weight:700; color:#1a1a1a; margin-top:35px; width:280px; margin-left:auto;">{{cargo}}</p>
<p style="font-size:34px; font-weight:700; color:#c41230; margin-top:5px; width:280px; margin-left:auto; transform:translateX(20px);">{{localizacao}}</p>
<p style="font-size:34px; font-weight:700; color:#777777; margin-top:5px; width:340px; margin-left:auto; line-height:1.25; transform:translateX(20px);">{{dias}}</p>
<p style="font-size:34px; font-weight:700; color:#777777; margin-top:5px; width:340px; margin-left:auto; line-height:1.25; transform:translateX(20px);">{{horario}}</p>
<p style="font-size:28px; color:#666666; line-height:1.4; margin-top:25px; width:340px; margin-left:auto;">{{descricao}}</p>
<p style="font-size:30px; font-weight:600; color:#c41230; margin-top:50px;">{{telefone}}</p>
<p style="font-size:30px; font-weight:600; color:#c41230; margin-top:6px;">{{email}}</p>
</div>
</div>
</body>
</html>`;

const sejaInstrutorFields: TemplateField[] = [
  { id: 'titulo1', label: 'Título linha 1', placeholder: '{{titulo1}}', defaultValue: 'Faça parte', maxLength: 15 },
  { id: 'titulo2', label: 'Título linha 2', placeholder: '{{titulo2}}', defaultValue: 'do nosso time', maxLength: 15 },
  { id: 'cargo', label: 'Cargo', placeholder: '{{cargo}}', defaultValue: 'Instrutor(a) de Pilates', maxLength: 30 },
  { id: 'localizacao', label: 'Localização', placeholder: '{{localizacao}}', defaultValue: 'São Paulo, SP — Presencial', maxLength: 70 },
  { id: 'dias', label: 'Dias', placeholder: '{{dias}}', defaultValue: 'De segunda a sexta', maxLength: 50 },
  { id: 'horario', label: 'Horário', placeholder: '{{horario}}', defaultValue: 'Das 07:00 às 14:00', maxLength: 50 },
  { id: 'descricao', label: 'Descrição', placeholder: '{{descricao}}', defaultValue: 'Procuramos profissional com formação completa em Pilates para conduzir aulas em grupo e individuais.', inputType: 'textarea', maxLength: 150 },
  { id: 'email', label: 'E-mail de contato', placeholder: '{{email}}', defaultValue: 'contato@purepilates.com.br', maxLength: 40 },
  { id: 'telefone', label: 'Telefone / WhatsApp', placeholder: '{{telefone}}', defaultValue: '(11) 99999-9999', maxLength: 25 },
];

const aniversarioInstrutorPlaceholderPhoto =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 420 560' preserveAspectRatio='xMidYMid slice'>
      <defs><linearGradient id='g' x1='0' x2='0' y1='0' y2='1'>
        <stop offset='0%' stop-color='#c6e6fa'/><stop offset='70%' stop-color='#eaf4fb'/>
      </linearGradient></defs>
      <rect width='420' height='560' fill='url(#g)'/>
      <ellipse cx='230' cy='150' rx='120' ry='55' fill='#ffffff'/>
      <ellipse cx='320' cy='140' rx='60' ry='35' fill='#ffffff'/>
      <path d='M0 430 Q 140 360 280 430 T 560 430 L 560 560 L 0 560 Z' fill='#a7c86b'/>
      <path d='M0 470 Q 200 420 400 470 T 800 470 L 800 560 L 0 560 Z' fill='#7eb04a'/>
    </svg>`,
  );

const aniversarioInstrutorHTML = (bgUrl: string, photoDefault: string) => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Aniversário do Instrutor</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
</head>
<body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#f0f0f0;">
<div style="position:relative; width:1080px; height:1080px; background-image:url('${bgUrl}'); background-size:cover; background-position:center; overflow:hidden; font-family:Montserrat, sans-serif;">

<div style="position:absolute; top:215px; right:95px; width:430px; height:655px; background:#ffffff; padding:18px; box-shadow:0 8px 24px rgba(0,0,0,0.1); box-sizing:border-box;">
<img src="{{fotoProfessor}}" style="width:100%; height:100%; object-fit:cover; display:block;" onerror="this.src='${photoDefault}'"/>
</div>

<div style="position:absolute; top:800px; left:50px; width:470px; font-size:24px; color:#4a4a4a; line-height:1.45; text-align:left; white-space:pre-line;">
{{mensagem}}
</div>

<div style="position:absolute; left:80px; bottom:50px; font-size:20px; color:#1a1a1a; font-weight:500;">{{assinatura}}</div>

</div>
</body>
</html>`;

const aniversarioInstrutorFields: TemplateField[] = [
  { id: 'fotoProfessor', label: 'Foto do instrutor(a)', placeholder: '{{fotoProfessor}}', defaultValue: aniversarioInstrutorPlaceholderPhoto, inputType: 'image' },
  { id: 'mensagem', label: 'Mensagem', placeholder: '{{mensagem}}', defaultValue: 'Instrutor(a) ____ desejamos muitas felicidades neste novo ciclo e que você continue sendo esse exemplo de profissional e de pessoa!', inputType: 'textarea', maxLength: 200 },
  { id: 'assinatura', label: 'Assinatura', placeholder: '{{assinatura}}', defaultValue: 'de: equipe Pure Pilates', maxLength: 50 },
];

const diaDasMaesHTML = (bgUrl: string) => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Dia das Mães</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
</head>
<body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#f0f0f0;">
<div style="position:relative; width:1080px; height:1440px; background:#ffffff; background-image:url('${bgUrl}'); background-size:cover; background-position:center; overflow:hidden; font-family:Montserrat, sans-serif;">
<div style="position:absolute; right:80px; top:340px; width:380px; text-align:left;">
<span style="display:inline; background:#c41230; color:#ffffff; padding:6px 14px; box-decoration-break:clone; -webkit-box-decoration-break:clone; font-size:32px; font-weight:500; line-height:1.7;">{{mensagem}}</span>
</div>
<div style="position:absolute; left:90px; top:870px; width:380px; color:#c41230; font-size:22px; font-weight:700; letter-spacing:3px; line-height:1.3; text-transform:uppercase;">{{unidade}}</div>
</div>
</body>
</html>`;

const diaDasMaesFields: TemplateField[] = [
  { id: 'mensagem', label: 'Mensagem', placeholder: '{{mensagem}}', defaultValue: 'Mãe é amor, cuidado e carinho que dura pra toda vida.', inputType: 'textarea', maxLength: 120 },
  { id: 'unidade', label: 'Unidade', placeholder: '{{unidade}}', defaultValue: 'Unidade Vila Mariana', maxLength: 70 },
];

const diaDasMaes50OffHTML = (bgUrl: string) => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Dia das Mães - 50% OFF</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
</head>
<body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#f0f0f0;">
<div style="position:relative; width:1080px; height:1350px; background-image:url('${bgUrl}'); background-size:cover; background-position:center; overflow:hidden; font-family:Montserrat, Arial, sans-serif;">
<div style="position:absolute; left:742px; top:519px; width:338px; height:110px; display:flex; align-items:center; justify-content:center; text-align:center; color:#ffffff; font-size:30px; font-weight:400; line-height:1.1; letter-spacing:0; white-space:nowrap;">
{{telefone}}
</div>
<div style="position:absolute; left:70px; bottom:55px; width:940px; min-height:104px; box-sizing:border-box; padding:22px 34px; border-radius:999px; background:#c10230; color:#ffffff; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center;">
<div style="font-size:34px; font-weight:700; line-height:1.12; white-space:nowrap;">{{nomeUnidade}}</div>
<div style="margin-top:8px; font-size:24px; font-weight:300; line-height:1.15; white-space:nowrap;">{{enderecoUnidade}}</div>
</div>
</div>
</body>
</html>`;

const diaDasMaes50OffFields: TemplateField[] = [
  { id: 'telefone', label: 'Telefone da unidade', placeholder: '{{telefone}}', defaultValue: '(11) 99999-9999', maxLength: 25 },
  { id: 'nomeUnidade', label: 'Nome da unidade', placeholder: '{{nomeUnidade}}', defaultValue: 'Nome da Unidade', maxLength: 30 },
  { id: 'enderecoUnidade', label: 'Endereço da unidade', placeholder: '{{enderecoUnidade}}', defaultValue: 'Endereço da unidade', maxLength: 68 },
];

const a4InformativoHTML = (bgUrl: string) => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>A4 Informativo</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
</head>
<body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#f0f0f0;">
<div style="position:relative; width:1410px; height:2000px; background-image:url('${bgUrl}'); background-size:cover; background-position:center; overflow:hidden; font-family:Montserrat, Arial, sans-serif;">
<div style="position:absolute; top:340px; left:80px; right:80px; text-align:center;">
<h1 style="font-size:62px; font-weight:800; color:#1a1a1a; margin:0; letter-spacing:3px; text-transform:uppercase;">{{titulo}}</h1>
<h2 style="font-size:32px; font-weight:600; color:#c41230; margin:18px 0 0; letter-spacing:1px;">{{subtitulo}}</h2>
</div>
<div style="position:absolute; top:620px; left:140px; right:140px; bottom:240px; display:flex; align-items:flex-start; justify-content:center;">
<p style="font-size:32px; color:#2a2a2a; line-height:1.6; white-space:pre-line; text-align:left; margin:0; width:100%;">{{mensagem}}</p>
</div>
<div style="position:absolute; bottom:90px; left:80px; right:80px; text-align:center;">
<p style="font-size:24px; font-weight:600; color:#1a1a1a; margin:0; letter-spacing:1px;">{{assinatura}}</p>
</div>
</div>
</body>
</html>`;

const a4InformativoFields: TemplateField[] = [
  { id: 'titulo', label: 'Título', placeholder: '{{titulo}}', defaultValue: 'COMUNICADO IMPORTANTE', maxLength: 35 },
  { id: 'subtitulo', label: 'Subtítulo', placeholder: '{{subtitulo}}', defaultValue: 'Aviso a todos os colaboradores', maxLength: 60 },
  { id: 'mensagem', label: 'Mensagem', placeholder: '{{mensagem}}', defaultValue: 'Prezados,\n\nInformamos que a unidade estará em horário especial nos próximos dias devido a manutenção programada.\n\nAgradecemos a compreensão de todos.', inputType: 'textarea', maxLength: 600 },
  { id: 'assinatura', label: 'Assinatura', placeholder: '{{assinatura}}', defaultValue: 'Pure Pilates Unidade X', maxLength: 80 },
];

const comunicadoCopaHTML = (bgUrl: string) => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Comunicado Copa — Clima de Torcida</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
</head>
<body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#f0f0f0;">
<div style="position:relative; width:1080px; height:1350px; background-image:url('${bgUrl}'); background-size:cover; background-position:center; overflow:hidden; font-family:Montserrat, Arial, sans-serif;">
<div style="position:absolute; left:0; right:0; top:740px; height:56px; line-height:56px; text-align:center; font-family:'Montserrat', sans-serif; color:#c10230; font-size:40px; font-weight:500; letter-spacing:0.5px;">{{data}}</div>
<div style="position:absolute; left:0; right:0; top:798px; height:56px; line-height:56px; text-align:center; font-family:'Montserrat', sans-serif; color:#c10230; font-size:40px; font-weight:700; letter-spacing:0.5px;">{{horario}}</div>
</div>
</body>
</html>`;

const comunicadoCopaFields: TemplateField[] = [
  { id: 'data', label: 'Data', placeholder: '{{data}}', defaultValue: 'Dia 13/06', maxLength: 30 },
  { id: 'horario', label: 'Horário', placeholder: '{{horario}}', defaultValue: 'Das 19:00 às 22:00', maxLength: 40 },
];

const feriadoAvisoHTML = (logoUrl: string) => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Aviso de Feriado</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
</head>
<body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#f0f0f0;">
<div style="position:relative; width:1080px; height:__CANVAS_H__px; background:linear-gradient(180deg,#ffffff 0%,#f1f1f1 100%); overflow:hidden; font-family:Montserrat, Arial, sans-serif;">

<!-- Forma pétala decorativa (marca) -->
<svg width="440" height="440" viewBox="0 0 250 250" style="position:absolute; top:-150px; right:-140px;"><path d="M 125 0 L 125 0 A 125 125 0 0 1 250 125 L 250 250 L 125 250 A 125 125 0 0 1 0 125 L 0 125 A 125 125 0 0 1 125 0 Z" fill="none" stroke="#C12030" stroke-width="3" opacity="0.30"/></svg>
<svg width="440" height="440" viewBox="0 0 250 250" style="position:absolute; bottom:-150px; left:-140px;"><path d="M 0 0 L 125 0 A 125 125 0 0 1 250 125 L 250 125 A 125 125 0 0 1 125 250 L 0 250 L 0 0 Z" fill="none" stroke="#DB9828" stroke-width="3" opacity="0.35"/></svg>
<svg width="300" height="300" viewBox="0 0 250 250" style="position:absolute; top:150px; left:-130px;"><path d="M 125 0 L 125 0 A 125 125 0 0 1 250 125 L 250 250 L 125 250 A 125 125 0 0 1 0 125 L 0 125 A 125 125 0 0 1 125 0 Z" fill="none" stroke="#C12030" stroke-width="3" opacity="0.22"/></svg>
<svg width="260" height="260" viewBox="0 0 250 250" style="position:absolute; bottom:120px; right:-110px;"><path d="M 0 0 L 125 0 A 125 125 0 0 1 250 125 L 250 125 A 125 125 0 0 1 125 250 L 0 250 L 0 0 Z" fill="none" stroke="#DB9828" stroke-width="3" opacity="0.25"/></svg>

<!-- Logo -->
<img src="{{logo}}" alt="Pure Pilates" style="{{logo:estilo}}"/>

<!-- AVISO! -->
<!--fld:aviso--><div style="position:absolute; top:220px; left:0; right:0; text-align:center; font-size:132px; font-weight:800; color:#C12030; letter-spacing:2px; line-height:1;">{{aviso}}</div><!--/fld:aviso-->

<!-- Mensagem opcional (ex.: "Desejamos um ótimo feriado!"), logo abaixo do card -->
<style>.pd-vazio:empty{display:none !important}</style>
<!--fld:mensagem--><div class="pd-vazio" style="position:absolute; left:165px; width:750px; top:calc(445px + __CARD_H__px + 44px); text-align:center; font-size:30px; font-weight:500; color:#231F20; line-height:1.4;">{{mensagem}}</div><!--/fld:mensagem-->

<!-- Card (forma-assinatura Pure: 3 cantos arredondados + 1 reto) -->
<div style="position:absolute; left:165px; top:445px; width:750px; height:__CARD_H__px; box-sizing:border-box; border:7px solid #C12030; border-radius:58px 58px 0 58px; background:rgba(255,255,255,0.55);"></div>

<!-- Conteúdo do card (centralizado) -->
<div style="position:absolute; left:165px; top:445px; width:750px; height:__CARD_H__px; box-sizing:border-box; padding:0 56px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center;">
  <!--fld:titulo--><div style="margin-bottom:24px;"><span style="display:inline-block; background:#1a1a1a; color:#ffffff; padding:13px 32px; border-radius:30px 30px 0 30px; font-size:28px; font-weight:700; letter-spacing:1px; text-transform:uppercase; line-height:1.25;">{{titulo}}</span></div><!--/fld:titulo-->
  <!--fld:subtitulo--><div style="font-size:25px; font-weight:700; color:#C12030; text-transform:uppercase; letter-spacing:0.5px; line-height:1.35; margin-bottom:34px;">{{subtitulo}}</div><!--/fld:subtitulo-->
  <div style="width:100%; display:flex; flex-direction:column; align-items:center;"><!--DATES--></div>
</div>

<!-- Barra inferior -->
<div style="position:absolute; left:0; right:0; bottom:0; height:70px; background:#C12030;"></div>

</div>
</body>
</html>`;

const feriadoAvisoFields: TemplateField[] = [
  { id: 'aviso', label: 'Chamada (AVISO!)', placeholder: '{{aviso}}', defaultValue: 'AVISO!', inputType: 'input', maxLength: 18 },
  { id: 'titulo', label: 'Título do feriado', placeholder: '{{titulo}}', defaultValue: 'FERIADO REVOLUÇÃO CONSTITUCIONALISTA', inputType: 'input', maxLength: 60 },
  { id: 'subtitulo', label: 'Subtítulo', placeholder: '{{subtitulo}}', defaultValue: 'Confira nosso horário de funcionamento!', inputType: 'input', maxLength: 80 },
  { id: 'mensagem', label: 'Mensagem de bom feriado (opcional)', placeholder: '{{mensagem}}', defaultValue: '', maxLength: 90 },
];

// Um pill de data. {{text}} é o texto (ex.: "09/07 - Fechado"). Duas variantes:
// "fechado" (vermelho preenchido) e "aberto" (branco com contorno vermelho).
const feriadoAvisoPill = (fill: string, color: string, border: string) =>
  `<div style="margin-bottom:18px;"><span style="display:inline-block; min-width:330px; box-sizing:border-box; text-align:center; background:${fill}; color:${color}; ${border} padding:13px 22px; border-radius:999px; font-size:27px; font-weight:700; letter-spacing:0.5px; white-space:nowrap;">{{text}}</span></div>`;

const feriadoAvisoRepeat: RepeatConfig = {
  token: '<!--DATES-->',
  canvasHeightToken: '__CANVAS_H__',
  cardHeightToken: '__CARD_H__',
  itemLabel: 'Data',
  addLabel: 'Adicionar data',
  defaultVariant: 'fechado',
  baseCount: 2,
  step: 80,
  baseCanvasHeight: 1350,
  baseCardHeight: 460,
  variants: [
    { id: 'fechado', label: 'Fechado', html: feriadoAvisoPill('#C12030', '#ffffff', '') },
    { id: 'aberto', label: 'Aberto', html: feriadoAvisoPill('#ffffff', '#C12030', 'border:3px solid #C12030;') },
  ],
  initial: [
    { text: '09/07 - Fechado', variant: 'fechado' },
    { text: '10/07 - Aberto', variant: 'aberto' },
  ],
};

// ─── Vale Presente (voucher 1512×662) ────────────────────────────────────────
// Recriado em HTML a partir do design do Canva (Vale Presente): painel esquerdo
// com a unidade (editável) + área direita com a chamada fixa, o pacote (editável)
// e o logo. Cores e proporções do original.
const valePresenteHTML = (logoUrl: string) => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Vale Presente</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
</head>
<body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#f0f0f0;">
<div style="position:relative; width:1512px; height:662px; background:#F2ECE3; overflow:hidden; font-family:Montserrat, Arial, sans-serif;">

  <!-- Painel esquerdo: unidade -->
  <div style="position:absolute; left:0; top:0; width:384px; height:662px; background:#A42A40; box-sizing:border-box; padding:0 36px 0 72px; display:flex; flex-direction:column; justify-content:center;">
    <div style="font-size:56px; font-weight:800; color:#ffffff; letter-spacing:1px; line-height:1;">Unidade</div>
    <div style="margin-top:12px; font-size:30px; font-style:italic; font-weight:500; color:#ffffff; line-height:1.15;">{{unidade}}</div>
  </div>

  <!-- Área direita -->
  <div style="position:absolute; left:384px; right:0; top:0; bottom:0; box-sizing:border-box; padding:48px 72px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center;">

    <div style="font-size:40px; font-weight:600; letter-spacing:14px; text-indent:14px; color:#2B2B2B; line-height:1;">VOUCHER</div>

    <div style="margin-top:44px; font-size:38px; font-style:italic; font-weight:500; color:#A42A40; line-height:1.28;">Um presente para colocar mais<br><span style="font-weight:800;">movimento na sua rotina.</span></div>

    <div style="margin-top:42px;"><span style="display:inline-block; border:3px solid #A42A40; border-radius:999px 999px 0 999px; padding:22px 52px; font-size:30px; font-weight:800; color:#1a1a1a; letter-spacing:0.5px; white-space:nowrap;">{{pacote}}</span></div>

    <div style="margin-top:42px; font-size:38px; font-weight:500; color:#A42A40; line-height:1.3;">E descubra uma nova forma de<br><span style="font-weight:800;">se sentir melhor todos os dias.</span></div>

    <img src="${logoUrl}" alt="Pure Pilates" style="margin-top:46px; width:156px; height:auto; display:block;"/>

  </div>

</div>
</body>
</html>`;

const valePresenteFields: TemplateField[] = [
  { id: 'unidade', label: 'Unidade', placeholder: '{{unidade}}', defaultValue: 'Anália Franco', maxLength: 28 },
  { id: 'pacote', label: 'Pacote / oferta', placeholder: '{{pacote}}', defaultValue: 'Pacote com 5 aulas', maxLength: 26 },
];

// ——— Depoimentos ————————————————————————————————————————————————
// Recriação em HTML do design "Depoimentos" do Canva (2 páginas, 1080x1350).
// A foto é um bloco removível (<!--fld:foto-->): o editor mostra a lixeira e o
// franqueado pode inserir a dele ou tirar o círculo da arte.

const depoimentoPlaceholderFoto =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 240' preserveAspectRatio='xMidYMid slice'>
      <rect width='240' height='240' fill='#e7e1d6'/>
      <circle cx='120' cy='96' r='43' fill='#c8bfb0'/>
      <path d='M26 240c0-51 42-83 94-83s94 32 94 83z' fill='#c8bfb0'/>
    </svg>`,
  );

/** Estrela cheia do rating (mesmo amarelo do Canva). */
const depoimentoEstrela = `<svg width="45" height="43" viewBox="0 0 24 24" fill="#FED154" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:0 8px;"><path d="M12 1.8l3.09 6.26 6.91.99-5 4.87 1.18 6.88L12 17.55l-6.18 3.25L7 13.92l-5-4.87 6.91-.99z"/></svg>`;

const depoimentoClaroHTML = (logoUrl: string, photoDefault: string) => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Depoimento — Card claro</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
</head>
<body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#f0f0f0;">
<div style="position:relative; width:1080px; height:1350px; background:#f2ede6; overflow:hidden; font-family:Montserrat, Arial, sans-serif;">

  <!-- Card branco. O padding-bottom de 169px reproduz a respiração do Canva; com
       justify-content:center o conteúdo cai na posição original e continua
       equilibrado quando a foto é removida ou o texto cresce. -->
  <div style="position:absolute; left:143px; top:279px; width:794px; height:792px; background:#ffffff; border-radius:52px; box-sizing:border-box; padding:30px 58px 169px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center;">

    <!--fld:foto-->
    <div style="width:183px; height:183px; border-radius:50%; overflow:hidden; flex-shrink:0; background:#e7e1d6;">
      <img src="{{foto}}" alt="" style="width:100%; height:100%; object-fit:cover; display:block;" onerror="this.src='${photoDefault}'"/>
    </div>
    <!--/fld:foto-->

    <div style="margin-top:27px; font-size:28px; font-weight:600; color:#000000; text-transform:uppercase; line-height:1.4;">{{nome}}</div>

    <div style="margin-top:8px; display:flex; justify-content:center; align-items:center;">${depoimentoEstrela}${depoimentoEstrela}${depoimentoEstrela}${depoimentoEstrela}${depoimentoEstrela}</div>

    <div style="margin-top:22px; font-size:40px; font-weight:600; color:#1b1b1b; line-height:1.4;">{{titulo}}</div>

    <div style="margin-top:12px; font-size:33px; font-weight:400; color:#525456; line-height:1.52; white-space:pre-line;">{{depoimento}}</div>

  </div>

  <img src="{{logo}}" alt="Pure Pilates" style="{{logo:estilo}}"/>

</div>
</body>
</html>`;

const depoimentoClaroFields: TemplateField[] = [
  { id: 'foto', label: 'Foto do aluno(a)', placeholder: '{{foto}}', defaultValue: depoimentoPlaceholderFoto, inputType: 'image' },
  { id: 'nome', label: 'Nome do aluno(a)', placeholder: '{{nome}}', defaultValue: 'Antonio Carlos', maxLength: 28 },
  { id: 'titulo', label: 'Destaque do depoimento', placeholder: '{{titulo}}', defaultValue: 'O melhor curso que já fiz!', maxLength: 40 },
  { id: 'depoimento', label: 'Depoimento', placeholder: '{{depoimento}}', defaultValue: 'Comecei sem saber o que esperar e hoje não abro mão. O acompanhamento é atencioso, a evolução é real e cada aula passa voando.', inputType: 'textarea', maxLength: 180 },
];

/** Uma linha da marca d'água "FEEDBACK" do fundo vermelho. */
const depoimentoFeedbackLinha = `<div style="height:150.5px; line-height:150.5px; font-size:154px; font-weight:700; color:#ffffff; opacity:0.31; text-align:center; letter-spacing:-9.7px; text-transform:uppercase; white-space:nowrap;">feedback</div>`;

const depoimentoVermelhoHTML = (logoUrl: string, photoDefault: string) => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Depoimento — Fundo vermelho</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
</head>
<body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#f0f0f0;">
<div style="position:relative; width:1080px; height:1350px; background:#a72537; overflow:hidden; font-family:Montserrat, Arial, sans-serif;">

  <!-- Marca d'água: FEEDBACK repetido. Altura da linha = line-height (não usar
       flex p/ centrar na vertical: quebra na exportação do PNG). -->
  <div style="position:absolute; left:99px; top:144px; width:882px;">${depoimentoFeedbackLinha}${depoimentoFeedbackLinha}${depoimentoFeedbackLinha}${depoimentoFeedbackLinha}${depoimentoFeedbackLinha}${depoimentoFeedbackLinha}</div>

  <!-- Card branco. A foto entra no fluxo como um espaçador de 94px (a parte que
       fica dentro do card) e o círculo transborda 146px pra cima. Removendo a
       foto, o espaçador some junto e o conteúdo se recentraliza. -->
  <div style="position:absolute; left:196px; top:460px; width:688px; height:432px; background:#ffffff; border-radius:40px; box-sizing:border-box; padding:0 26px 57px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center;">

    <!--fld:foto-->
    <div style="position:relative; width:240px; height:94px; flex-shrink:0;">
      <div style="position:absolute; left:0; top:-146px; width:240px; height:240px; border-radius:50%; overflow:hidden; background:#e7e1d6;">
        <img src="{{foto}}" alt="" style="width:100%; height:100%; object-fit:cover; display:block;" onerror="this.src='${photoDefault}'"/>
      </div>
    </div>
    <!--/fld:foto-->

    <div style="margin-top:87px; font-size:47px; font-weight:700; color:#231f20; line-height:0.89;">{{nome}}</div>

    <div style="margin-top:21px; font-size:33px; font-weight:400; color:#000000; line-height:1.18; white-space:pre-line;">{{depoimento}}</div>

  </div>

  <!-- Logo em branco: o asset é o colorido, invertido via filtro. -->
  <img src="{{logo}}" alt="Pure Pilates" style="{{logo:estilo}}"/>

</div>
</body>
</html>`;

const depoimentoVermelhoFields: TemplateField[] = [
  { id: 'foto', label: 'Foto do aluno(a)', placeholder: '{{foto}}', defaultValue: depoimentoPlaceholderFoto, inputType: 'image' },
  { id: 'nome', label: 'Nome do aluno(a)', placeholder: '{{nome}}', defaultValue: 'Juliana Silva', maxLength: 28 },
  { id: 'depoimento', label: 'Depoimento', placeholder: '{{depoimento}}', defaultValue: 'Atendimento excelente e a melhor aula que tive, com certeza irei recomendar para todos os meus amigos e familiares.', inputType: 'textarea', maxLength: 140 },
];

// Catálogo de produtos da Pure Store (dropdown da tabela de preços). Deduplicado
// e ordenado alfabeticamente (pt-BR) em tempo de carga. Para atualizar a lista,
// é só editar este array — a ordem é resolvida sozinha.
const pureStoreCatalogRaw: string[] = [
  'Conjunto Fitness (Top + Legging)',
  'Top Fitness Alça Poliamida',
  'Legging Fitness Alta Compressão',
  'Jaqueta Fitness em Poliamida',
  'Corta Vento Cinza - Impermeável',
  'Camiseta Fitness Feminina - Cinza',
  'Legging - Burgundy',
  'Top Nadador - Burgundy',
  'Macaquinho - Burgundy',
  'Camiseta Feminina - Burgundy',
  'Coração Pilateiro',
  'Regata Batidas',
  'Regata Palavras',
  'Regata Posições',
  'Moletom Pure Pilates Canguru',
  'Moletom "A Melhor Hora do Seu Dia"',
  'Camiseta Fitness Masculina Preta',
  'Jaqueta de Moletom - Pulse',
  'Calça de Moletom Masculina - Pulse',
  'Camiseta Aparelhos - Masculina',
  'Camiseta Pilates Lateral - Feminina',
  'Camiseta Pilates Lateral - Masculina',
  'Lancheira Cinza',
  'Lancheira Preta',
  'Garrafa Prata',
  'Garrafa Preta',
  'Meia Boneco',
  'Meia Logo',
  'Sapatilha Logo',
  'Sapatilha Boneco',
  'Bodie Baby',
  'Bolsa/Mochila - Preta',
  'Bolsa/Mochila - Vermelha',
];

const pureStoreCatalog: string[] = Array.from(new Set(pureStoreCatalogRaw)).sort((a, b) =>
  a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }),
);

// Formas aprovadas da marca (repo pure-pilates-brand). Pétala sólida (forma-3)
// sangrando no topo-direito como âncora de marca + pétala contornada (forma-3),
// laranja e delicada, sangrando embaixo-esquerda. Paths dos SVGs oficiais.
const pureStoreShapes = `
  <svg width="520" height="520" viewBox="0 0 250 250" style="position:absolute; top:-190px; right:-170px; z-index:0;"><path d="M 125 0 L 125 0 A 125 125 0 0 1 250 125 L 250 250 L 125 250 A 125 125 0 0 1 0 125 L 0 125 A 125 125 0 0 1 125 0 Z" fill="#C12030"/></svg>
  <svg width="380" height="380" viewBox="-5 -5 260 260" style="position:absolute; bottom:-130px; left:-130px; z-index:0;"><path d="M 125 0 L 125 0 A 125 125 0 0 1 250 125 L 250 250 L 125 250 A 125 125 0 0 1 0 125 L 0 125 A 125 125 0 0 1 125 0 Z" fill="none" stroke="#DB9828" stroke-width="4" opacity="0.5"/></svg>`;

// Uma linha de produto: item à esquerda, "R$ preço" à direita (vermelho, negrito),
// separadas por uma divisória fina. Sem zebrado pesado — leitura editorial.
const pureStoreRowHtml = `<div style="display:flex; align-items:center; height:66px; border-bottom:1px solid #E7DFD5;">
  <div style="flex:1; padding-right:24px; font-size:31px; font-weight:400; color:#231F20; overflow:hidden; white-space:nowrap; text-overflow:ellipsis;">{{item}}</div>
  <div style="width:320px; text-align:right; font-size:31px; font-weight:700; color:#C12030;">R$ {{preco}}</div>
</div>`;

const pureStoreHTML = () => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pure Store — Tabela de Preços</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
</head>
<body style="margin:0; display:flex; justify-content:center; align-items:flex-start; background:#e9e6e1;">
<div style="position:relative; width:1488px; background:#FBF8F4; font-family:Montserrat, Arial, sans-serif; box-sizing:border-box; overflow:hidden;">

  ${pureStoreShapes}

  <div style="position:relative; z-index:1; padding:0 120px;">

    <!-- Cabeçalho: logo + título + acento -->
    <div style="height:436px; box-sizing:border-box; padding-top:88px;">
      <img src="/images/pure-design/pure-store-logo.png" alt="Pure Store" style="height:104px; width:auto; display:block;"/>
      <div style="margin-top:52px; font-size:72px; font-weight:800; color:#231F20; letter-spacing:-1px; line-height:0.98;">Tabela de<br>preços</div>
      <div style="margin-top:26px; width:132px; height:9px; background:#DB9828; border-radius:5px;"></div>
    </div>

    <!-- Rótulos das colunas -->
    <div style="height:64px; box-sizing:border-box; display:flex; align-items:flex-end; padding-bottom:16px; border-bottom:3px solid #231F20;">
      <div style="flex:1; font-size:23px; font-weight:700; letter-spacing:4px; color:#C12030;">PRODUTO</div>
      <div style="width:320px; text-align:right; font-size:23px; font-weight:700; letter-spacing:4px; color:#C12030;">VALOR</div>
    </div>

    <!-- Linhas de produto (geradas) --><!--ROWS-->

    <!-- PIX (card removível) -->
    <!--fld:pix--><div style="height:204px; box-sizing:border-box; padding-top:48px;">
      <div style="height:156px; box-sizing:border-box; background:#231F20; border-radius:44px 44px 0 44px; padding:32px 48px; color:#ffffff;">
        <div style="display:flex; align-items:center; gap:16px;">
          <span style="display:inline-block; background:#C12030; color:#ffffff; font-size:22px; font-weight:700; letter-spacing:3px; padding:9px 22px; border-radius:999px;">PIX</span>
          <span style="font-size:26px; font-weight:700; letter-spacing:2px;">PAGAMENTO</span>
        </div>
        <div style="margin-top:26px; font-size:28px; font-weight:400; color:#F2ECE4;">Chave PIX:&nbsp;<span style="font-weight:700; color:#ffffff;">{{chave1}}</span></div>
      </div>
    </div><!--/fld:pix-->

    <!-- Espaço inferior -->
    <div style="height:96px;"></div>

  </div>

</div>
</body>
</html>`;

const pureStoreFields: TemplateField[] = [
  { id: 'chave1', label: 'Chave PIX', placeholder: '{{chave1}}', defaultValue: '', maxLength: 60 },
];

// ─── Série "Enxoval de Inauguração" (feed 1080×1440) ─────────────────────────
// Fundos limpos exportados do Canva (fotos/fitas/títulos fixos + logo); os
// campos editáveis (pills, caixa de data, etc.) são desenhados em HTML por cima.

// Arte 1 — "Vem aí uma nova Pure Pilates": pill do nome da unidade, caixa de
// data (dia|mês|ano) e pill da cidade/bairro, no miolo vazio do fundo.
const inauguracaoVemAiHTML = (bgUrl: string) => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Inauguração — Vem aí uma nova Pure Pilates</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
</head>
<body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#f0f0f0;">
<div style="position:relative; width:1080px; height:1440px; background-image:url('${bgUrl}'); background-size:cover; background-position:center; overflow:hidden; font-family:Montserrat, Arial, sans-serif;">

  <!--fld:nomeUnidade--><div style="position:absolute; left:220px; top:498px; width:640px; height:80px; box-sizing:border-box; border:2px solid #C12030; border-radius:999px; background:rgba(255,255,255,0.45); display:flex; align-items:center; justify-content:center; text-align:center; padding:0 26px;">
    <span style="font-size:29px; font-weight:700; letter-spacing:1.5px; color:#231F20; text-transform:uppercase; line-height:1.1;">{{nomeUnidade}}</span>
  </div><!--/fld:nomeUnidade-->

  <div style="position:absolute; left:220px; top:606px; width:640px; height:98px; box-sizing:border-box; background:#C12030; border-radius:14px; display:flex; align-items:center;">
    <div style="flex:1; text-align:center; color:#ffffff; font-size:46px; font-weight:800; letter-spacing:1px;">{{dia}}</div>
    <div style="width:2px; height:54px; background:rgba(255,255,255,0.65);"></div>
    <div style="flex:1; text-align:center; color:#ffffff; font-size:46px; font-weight:800; letter-spacing:1px;">{{mes}}</div>
    <div style="width:2px; height:54px; background:rgba(255,255,255,0.65);"></div>
    <div style="flex:1; text-align:center; color:#ffffff; font-size:46px; font-weight:800; letter-spacing:1px;">{{ano}}</div>
  </div>

  <!--fld:cidade--><div style="position:absolute; left:220px; top:732px; width:640px; height:80px; box-sizing:border-box; border:2px solid #C12030; border-radius:999px; display:flex; align-items:center; justify-content:center; text-align:center; padding:0 26px;">
    <span style="font-size:29px; font-weight:700; letter-spacing:1.5px; color:#231F20; text-transform:uppercase; line-height:1.1;">{{cidade}}</span>
  </div><!--/fld:cidade-->

</div>
</body>
</html>`;

const inauguracaoVemAiFields: TemplateField[] = [
  { id: 'nomeUnidade', label: 'Nome da unidade', placeholder: '{{nomeUnidade}}', defaultValue: 'NOME DA UNIDADE', maxLength: 34 },
  { id: 'dia', label: 'Dia', placeholder: '{{dia}}', defaultValue: '10', maxLength: 2 },
  { id: 'mes', label: 'Mês', placeholder: '{{mes}}', defaultValue: '08', maxLength: 2 },
  { id: 'ano', label: 'Ano', placeholder: '{{ano}}', defaultValue: '2026', maxLength: 4 },
  { id: 'cidade', label: 'Cidade ou bairro', placeholder: '{{cidade}}', defaultValue: 'CIDADE OU BAIRRO', maxLength: 34 },
];

// 1x1 transparente: default do campo de foto. Enquanto vazio, mostra a "moldura"
// (paisagem) que já vem no fundo; ao subir a foto do estúdio, ela cobre o topo.
const TRANSPARENT_PX =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

// Arte 2 — "A melhor hora do seu dia está chegando em": foto do estúdio editável
// na moldura do topo + bairro, pill do nome, caixa de endereço/referência e data.
const inauguracaoMelhorHoraHTML = (bgUrl: string) => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Inauguração — A melhor hora está chegando</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
</head>
<body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#f0f0f0;">
<div style="position:relative; width:1080px; height:1440px; background-image:url('${bgUrl}'); background-size:cover; background-position:center; overflow:hidden; font-family:Montserrat, Arial, sans-serif;">

  <!-- Foto do estúdio (moldura do topo). Vazio = mostra a paisagem do fundo. -->
  <img src="{{foto}}" style="position:absolute; left:0; top:0; width:1080px; height:515px; object-fit:cover; display:block;" onerror="this.style.display='none'"/>

  <!--fld:bairro--><div style="position:absolute; left:70px; right:70px; top:702px; text-align:center; font-size:36px; font-weight:700; color:#6d6d6d; text-transform:uppercase; letter-spacing:1px; line-height:1.1;">{{bairro}}</div><!--/fld:bairro-->

  <!--fld:nomeUnidade--><div style="position:absolute; left:220px; top:772px; width:640px; height:80px; box-sizing:border-box; border:2px solid #C12030; border-radius:999px; background:rgba(255,255,255,0.45); display:flex; align-items:center; justify-content:center; text-align:center; padding:0 26px;">
    <span style="font-size:29px; font-weight:700; letter-spacing:1.5px; color:#231F20; text-transform:uppercase; line-height:1.1;">{{nomeUnidade}}</span>
  </div><!--/fld:nomeUnidade-->

  <!--fld:endereco--><div style="position:absolute; left:150px; top:890px; width:780px; height:132px; box-sizing:border-box; background:#C12030; border-radius:16px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:0 34px; color:#ffffff;">
    <div style="font-size:28px; font-weight:700; line-height:1.25;">{{endereco}}</div>
    <div style="font-size:24px; font-weight:400; line-height:1.25; margin-top:5px;">{{referencia}}</div>
  </div><!--/fld:endereco-->

  <div style="position:absolute; left:320px; top:1058px; width:440px; height:82px; box-sizing:border-box; border:2px solid #C12030; border-radius:999px; display:flex; align-items:center;">
    <div style="flex:1; text-align:center; color:#C12030; font-size:38px; font-weight:800;">{{dia}}</div>
    <div style="width:2px; height:44px; background:#C12030;"></div>
    <div style="flex:1; text-align:center; color:#C12030; font-size:38px; font-weight:800;">{{mes}}</div>
    <div style="width:2px; height:44px; background:#C12030;"></div>
    <div style="flex:1; text-align:center; color:#C12030; font-size:38px; font-weight:800;">{{ano}}</div>
  </div>

</div>
</body>
</html>`;

const inauguracaoMelhorHoraFields: TemplateField[] = [
  { id: 'foto', label: 'Foto do estúdio', placeholder: '{{foto}}', defaultValue: TRANSPARENT_PX, inputType: 'image' },
  { id: 'bairro', label: 'Nome do bairro', placeholder: '{{bairro}}', defaultValue: 'NOME DO BAIRRO', maxLength: 30 },
  { id: 'nomeUnidade', label: 'Nome da unidade', placeholder: '{{nomeUnidade}}', defaultValue: 'NOME DA UNIDADE', maxLength: 34 },
  { id: 'endereco', label: 'Endereço completo', placeholder: '{{endereco}}', defaultValue: 'Rua Alegre, 123 — Cidade Brasileira', maxLength: 60 },
  { id: 'referencia', label: 'Ponto de referência', placeholder: '{{referencia}}', defaultValue: 'Próximo ao mercado central', maxLength: 60 },
  { id: 'dia', label: 'Dia', placeholder: '{{dia}}', defaultValue: '10', maxLength: 2 },
  { id: 'mes', label: 'Mês', placeholder: '{{mes}}', defaultValue: '08', maxLength: 2 },
  { id: 'ano', label: 'Ano', placeholder: '{{ano}}', defaultValue: '2026', maxLength: 4 },
];

// Arte 3 — "Nossa inauguração já tem data" (bilhete no fundo vermelho): bloco de
// data (dia da semana | dia | hora, com mês embaixo) + unidade, endereço e telefone.
const NOTE_RED = '#a72537';
const NOTE_DARK = '#231f20';
const inauguracaoJaTemDataHTML = (bgUrl: string) => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Inauguração — Já tem data</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
</head>
<body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#f0f0f0;">
<div style="position:relative; width:1080px; height:1440px; background-image:url('${bgUrl}'); background-size:cover; background-position:center; overflow:hidden; font-family:Montserrat, Arial, sans-serif; color:${NOTE_RED};">

  <!-- Tudo num container inclinado no mesmo ângulo do bilhete (~-3.5°) -->
  <div style="position:absolute; left:210px; width:660px; top:660px; transform:rotate(-3.5deg); transform-origin:center;">

    <!-- Bloco de data (cores/pesos exatos do Canva) -->
    <div style="display:flex; align-items:center; justify-content:center; gap:24px;">
      <div style="font-size:35px; font-weight:400; letter-spacing:0.5px; text-transform:uppercase; color:${NOTE_DARK};">{{diaSemana}}</div>
      <div style="width:2px; height:96px; background:${NOTE_RED};"></div>
      <div style="text-align:center; line-height:1;">
        <div style="font-size:22px; font-weight:400; letter-spacing:2px; text-transform:uppercase; color:${NOTE_RED};">no dia</div>
        <div style="font-size:80px; font-weight:700; margin:2px 0; color:${NOTE_RED};">{{dia}}</div>
        <div style="font-size:22px; font-weight:400; letter-spacing:2px; text-transform:uppercase; color:${NOTE_RED};">{{mes}}</div>
      </div>
      <div style="width:2px; height:96px; background:${NOTE_RED};"></div>
      <div style="font-size:35px; font-weight:400; letter-spacing:0.5px; text-transform:uppercase; color:${NOTE_DARK};">{{hora}}</div>
    </div>

    <!-- Unidade + endereço + telefone -->
    <div style="margin-top:118px; text-align:center;">
      <div style="font-size:34px; font-weight:700; font-style:italic; color:${NOTE_RED}; margin-bottom:26px;">{{nomeUnidade}}</div>
      <div style="display:flex; align-items:center; justify-content:center; gap:9px; font-size:27px; font-weight:400; font-style:italic; color:${NOTE_DARK};">
        <svg width="19" height="25" viewBox="0 0 24 24" fill="${NOTE_RED}" style="flex-shrink:0;"><path d="M12 2C7.6 2 4 5.6 4 10c0 5.4 7 11.5 7.3 11.8.4.3.9.3 1.3 0C13 21.5 20 15.4 20 10c0-4.4-3.6-8-8-8zm0 11a3 3 0 110-6 3 3 0 010 6z"/></svg>
        <span>{{endereco}}</span>
      </div>
      <div style="font-size:27px; font-weight:400; font-style:italic; color:${NOTE_DARK}; margin-top:12px;">{{telefone}}</div>
    </div>

  </div>

</div>
</body>
</html>`;

const inauguracaoJaTemDataFields: TemplateField[] = [
  { id: 'diaSemana', label: 'Dia da semana', placeholder: '{{diaSemana}}', defaultValue: 'Sábado', maxLength: 13 },
  { id: 'dia', label: 'Dia', placeholder: '{{dia}}', defaultValue: '12', maxLength: 2 },
  { id: 'hora', label: 'Horário', placeholder: '{{hora}}', defaultValue: '14 horas', maxLength: 14 },
  { id: 'mes', label: 'Mês', placeholder: '{{mes}}', defaultValue: 'Setembro', maxLength: 12 },
  { id: 'nomeUnidade', label: 'Nome da unidade', placeholder: '{{nomeUnidade}}', defaultValue: 'Nome da unidade', maxLength: 34 },
  { id: 'endereco', label: 'Endereço', placeholder: '{{endereco}}', defaultValue: 'Rua Alegre, 123 - Cidade Brasileira', maxLength: 48 },
  { id: 'telefone', label: 'Telefone', placeholder: '{{telefone}}', defaultValue: '11 9999-9999', maxLength: 20 },
];

// Arte 5 — "Sua primeira aula na nova Pure Pilates começa aqui" (foto no reformer):
// 3 pills vermelhos sólidos (unidade, telefone, endereço) abaixo do "Agende".
const inauguracaoPrimeiraAulaHTML = (bgUrl: string) => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Inauguração — Sua primeira aula</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
</head>
<body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#f0f0f0;">
<div style="position:relative; width:1080px; height:1440px; background-image:url('${bgUrl}'); background-size:cover; background-position:center; overflow:hidden; font-family:Montserrat, Arial, sans-serif;">

  <!--fld:nomeUnidade--><div style="position:absolute; left:275px; top:852px; width:530px; height:80px; box-sizing:border-box; background:${NOTE_RED}; border-radius:999px; display:flex; align-items:center; justify-content:center; text-align:center; padding:0 26px;"><span style="font-size:31px; font-weight:400; color:#ffffff; text-transform:uppercase; letter-spacing:0.5px; white-space:nowrap;">{{nomeUnidade}}</span></div><!--/fld:nomeUnidade-->

  <!--fld:telefone--><div style="position:absolute; left:275px; top:946px; width:530px; height:80px; box-sizing:border-box; background:${NOTE_RED}; border-radius:999px; display:flex; align-items:center; justify-content:center; text-align:center; padding:0 26px;"><span style="font-size:31px; font-weight:400; color:#ffffff; text-transform:uppercase; letter-spacing:0.5px; white-space:nowrap;">{{telefone}}</span></div><!--/fld:telefone-->

  <!--fld:endereco--><div style="position:absolute; left:275px; top:1040px; width:530px; height:80px; box-sizing:border-box; background:${NOTE_RED}; border-radius:999px; display:flex; align-items:center; justify-content:center; text-align:center; padding:0 26px;"><span style="font-size:31px; font-weight:400; color:#ffffff; text-transform:uppercase; letter-spacing:0.5px; white-space:nowrap;">{{endereco}}</span></div><!--/fld:endereco-->

</div>
</body>
</html>`;

const inauguracaoPrimeiraAulaFields: TemplateField[] = [
  { id: 'nomeUnidade', label: 'Nome da unidade', placeholder: '{{nomeUnidade}}', defaultValue: 'Nome da unidade', maxLength: 30 },
  { id: 'telefone', label: 'Telefone', placeholder: '{{telefone}}', defaultValue: '11 9999-9999', maxLength: 22 },
  { id: 'endereco', label: 'Endereço', placeholder: '{{endereco}}', defaultValue: 'Endereço', maxLength: 34 },
];

// Arte 6 — "Inauguramos" (fundo vermelho, fita/tesoura): frase com nome da
// unidade em negrito, endereço (2 linhas) e telefone num pill branco vazado.
const inauguracaoInauguramosHTML = (bgUrl: string) => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Inauguração — Inauguramos</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
</head>
<body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#f0f0f0;">
<div style="position:relative; width:1080px; height:1440px; background-image:url('${bgUrl}'); background-size:cover; background-position:center; overflow:hidden; font-family:Montserrat, Arial, sans-serif; color:#ffffff; text-align:center;">

  <!-- Frase de boas-vindas -->
  <div style="position:absolute; left:150px; width:780px; top:520px; font-size:37px; font-weight:400; line-height:1.4;">A Pure Pilates <span style="font-weight:700;">{{nomeUnidade}}</span> já está pronta para receber você.</div>

  <!-- Endereço (2 linhas) -->
  <div style="position:absolute; left:150px; width:780px; top:742px; font-size:30px; font-weight:400; line-height:1.4;">{{endereco}}<br>{{cidade}}</div>

  <!-- Telefone (pill branco vazado) -->
  <div style="position:absolute; left:360px; width:360px; top:858px; height:76px; box-sizing:border-box; border:2px solid #ffffff; border-radius:999px; display:flex; align-items:center; justify-content:center;">
    <span style="font-size:30px; font-weight:600;">{{telefone}}</span>
  </div>

</div>
</body>
</html>`;

const inauguracaoInauguramosFields: TemplateField[] = [
  { id: 'nomeUnidade', label: 'Nome da unidade', placeholder: '{{nomeUnidade}}', defaultValue: 'nome da unidade', maxLength: 30 },
  { id: 'endereco', label: 'Endereço', placeholder: '{{endereco}}', defaultValue: 'Rua Alegre, 123', maxLength: 40 },
  { id: 'cidade', label: 'Cidade', placeholder: '{{cidade}}', defaultValue: 'Cidade Brasileira', maxLength: 40 },
  { id: 'telefone', label: 'Telefone', placeholder: '{{telefone}}', defaultValue: '11 9999-9999', maxLength: 20 },
];

// Coringas: refeitos em HTML em pureDesignModelosNovos.ts (17/11/2026).

// ── Pure Store — Coringa (17/11/2026) ────────────────────────────────────────
// O coringa da Pure Store: vitrine de produtos para qualquer divulgação da loja.
// Desenhado no Canva ("Pré-Venda", 1080x1440). Fundo = a página sem fotos, sem
// textos e sem a etiqueta. A etiqueta vermelha é desenhada aqui, opcional: some
// quando o texto fica vazio e pode ser removida no editor.
// Três molduras: uma grande à esquerda e duas empilhadas à direita.

/** Moldura vazia: creme com um ícone de foto, até a pessoa subir a imagem. */
const molduraVaziaFoto =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' preserveAspectRatio='xMidYMid slice'>
      <rect width='400' height='400' fill='#ece4d6'/>
      <g fill='none' stroke='#b9a98f' stroke-width='10' stroke-linejoin='round'>
        <rect x='130' y='150' width='140' height='100' rx='14'/>
        <circle cx='200' cy='200' r='26'/>
      </g>
    </svg>`,
  );

const pureStoreCoringaHTML = (bgUrl: string) => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pure Store — Coringa</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
</head>
<body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#f0f0f0;">
<div style="position:relative; width:1080px; height:1440px; background:#f7f2e6; background-image:url('${bgUrl}'); background-size:cover; background-position:center; overflow:hidden; font-family:Montserrat, sans-serif;">
<style>.pd-selo:empty{display:none !important}</style>
<!--fld:selo--><div style="position:absolute; left:62px; top:72px; height:72px; display:flex; align-items:center;"><span class="pd-selo" style="display:inline-block; min-width:271px; box-sizing:border-box; padding:0 40px; height:72px; line-height:72px; text-align:center; border-radius:36px; background:#b3263a; color:#ffffff; font-size:23px; font-weight:300; letter-spacing:3px; text-transform:uppercase; white-space:nowrap;">{{selo}}</span></div><!--/fld:selo-->
{{galeria}}
<img src="{{logo}}" alt="" style="{{logo:estilo}}"/>
<div style="position:absolute; left:74px; top:994px; width:900px; font-size:60px; font-weight:300; color:#a22b3b; line-height:1.15; white-space:pre-line;">{{titulo}}</div>
<div style="position:absolute; left:74px; top:1156px; width:900px; font-size:31px; font-weight:300; color:#a22b3b; line-height:1.4; white-space:pre-line;">{{texto}}</div>
</div>
</body>
</html>`;

const pureStoreCoringaFields: TemplateField[] = [
  { id: 'selo', label: 'Etiqueta (opcional: deixe vazio ou remova)', placeholder: '{{selo}}', defaultValue: 'Novidade', maxLength: 18 },
  {
    id: 'logo',
    label: 'Logo',
    placeholder: '{{logo}}',
    defaultValue: '/images/pure-design/pure-store-logo.png',
    inputType: 'logo',
    unidadesLogo: ['Pure Store'],
    logoCaixa: { x: 826, y: 66, largura: 192, proporcao: 0.437 },
  },
  { id: 'foto1', label: 'Foto grande (esquerda)', placeholder: '{{foto1}}', defaultValue: molduraVaziaFoto, inputType: 'image' },
  { id: 'foto2', label: 'Foto de cima (direita)', placeholder: '{{foto2}}', defaultValue: molduraVaziaFoto, inputType: 'image' },
  { id: 'foto3', label: 'Foto de baixo (direita)', placeholder: '{{foto3}}', defaultValue: molduraVaziaFoto, inputType: 'image' },
  { id: 'titulo', label: 'Título', placeholder: '{{titulo}}', defaultValue: 'Peças que encantam\nno primeiro olhar.', inputType: 'textarea', maxLength: 50 },
  { id: 'texto', label: 'Texto', placeholder: '{{texto}}', defaultValue: 'Escolha seus novos favoritos e descubra as novidades\nque podem fazer parte da sua arara.', inputType: 'textarea', maxLength: 120 },
];

// ── Pure Store — Foto de fundo (17/11/2026) ──────────────────────────────────
// A foto ocupa a arte inteira (obrigatória, enquadrável por arraste/zoom) e um
// cartão creme embaixo traz chamada, título, texto, um filete e um botão. A
// etiqueta do alto é opcional (some quando vazia). Referência: arte "A MOVE está
// quase chegando" do time.
const pureStoreFotoFundoHTML = (photoDefault: string) => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pure Store — Foto de fundo</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
</head>
<body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#f0f0f0;">
<div style="position:relative; width:1080px; height:1440px; background:#e9dccb; overflow:hidden; font-family:Montserrat, sans-serif;">
<img src="{{fundo}}" style="position:absolute; left:0; top:0; width:1080px; height:1440px; object-fit:cover; display:block;" onerror="this.src='${photoDefault}'"/>
<style>.pd-vazio:empty{display:none !important}</style>
<!--fld:selo--><div style="position:absolute; left:80px; top:80px;"><span class="pd-vazio" style="display:inline-block; min-width:233px; box-sizing:border-box; padding:0 32px; height:56px; line-height:56px; text-align:center; border-radius:28px; background:#a7253a; color:#f7efe3; font-size:21px; font-weight:300; letter-spacing:4px; text-transform:uppercase; white-space:nowrap;">{{selo}}</span></div><!--/fld:selo-->
<div style="position:absolute; left:80px; top:846px; width:920px; height:424px; box-sizing:border-box; padding:44px 56px 0; border-radius:36px; background:#f8f3e8; color:#a7253a;">
<!--fld:chamada--><div class="pd-vazio" style="font-size:25px; font-weight:200; line-height:1.3; margin-bottom:22px;">{{chamada}}</div><!--/fld:chamada-->
<div style="font-size:50px; font-weight:300; line-height:1.12; letter-spacing:0.3px;">{{titulo}}</div>
<div style="margin-top:20px; font-size:25px; font-weight:300; line-height:1.5; color:#bb6474; max-width:680px; white-space:pre-line;">{{texto}}</div>
<div style="position:absolute; left:56px; right:56px; top:270px; height:2px; background:#a7253a; opacity:.85;"></div>
<!--fld:botao--><div style="position:absolute; left:56px; top:298px;"><span class="pd-vazio" style="display:inline-block; box-sizing:border-box; padding:0 38px; height:60px; line-height:60px; border-radius:30px; background:#a7253a; color:#f7efe3; font-size:20px; font-weight:300; letter-spacing:5px; text-transform:uppercase; white-space:nowrap;">{{botao}}</span></div><!--/fld:botao-->
</div>
</div>
</body>
</html>`;

const pureStoreFotoFundoFields: TemplateField[] = [
  { id: 'fundo', label: 'Foto de fundo (obrigatória)', placeholder: '{{fundo}}', defaultValue: molduraVaziaFoto, inputType: 'image', obrigatoria: true },
  { id: 'selo', label: 'Etiqueta do alto (opcional)', placeholder: '{{selo}}', defaultValue: 'Pré-venda', maxLength: 18 },
  { id: 'chamada', label: 'Chamada pequena (opcional)', placeholder: '{{chamada}}', defaultValue: '(últimos dias)', maxLength: 30 },
  { id: 'titulo', label: 'Título', placeholder: '{{titulo}}', defaultValue: 'A MOVE está quase chegando.', maxLength: 32 },
  { id: 'texto', label: 'Texto', placeholder: '{{texto}}', defaultValue: 'Últimos dias para garantir seus favoritos e preparar\nsua unidade para receber a nova coleção.', inputType: 'textarea', maxLength: 110 },
  { id: 'botao', label: 'Botão (opcional)', placeholder: '{{botao}}', defaultValue: 'Garanta já seus pedidos', maxLength: 28 },
];

// Logos soltos dos modelos da Pure Pilates: viram campo de logo (arrastável).
const logoFeriadoAviso: TemplateField = {
  id: 'logo',
  label: 'Logo',
  placeholder: '{{logo}}',
  defaultValue: '/images/pure-design/pure-pilates-logo.png',
  inputType: 'logo',
  unidadesLogo: ['Pure Pilates'],
  logoCaixa: { x: 450, y: 36, largura: 180, proporcao: 1 },
};

const logoDepoimentoClaro: TemplateField = {
  id: 'logo',
  label: 'Logo',
  placeholder: '{{logo}}',
  defaultValue: '/images/pure-design/pure-pilates-logo-trim.png',
  inputType: 'logo',
  unidadesLogo: ['Pure Pilates'],
  logoCaixa: { x: 415, y: 1125, largura: 249, proporcao: 0.414 },
};

const logoDepoimentoVermelho: TemplateField = {
  id: 'logo',
  label: 'Logo',
  placeholder: '{{logo}}',
  defaultValue: '/images/pure-design/pure-pilates-logo-trim.png',
  inputType: 'logo',
  unidadesLogo: ['Pure Pilates'],
  logoCaixa: { x: 425, y: 1089, largura: 231, proporcao: 0.414, filtro: 'brightness(0) invert(1)' },
};

export const pureDesignTemplates: PureDesignTemplate[] = [
  ...MODELOS_NOVOS,
  ...FERIADOS_2027,
  ...RECESSO,
  {
    id: 'inauguracao-vem-ai',
    name: 'Inauguração — Vem aí uma nova (sem foto)',
    category: 'Inauguração',
    thumbnail: '/images/pure-design/inauguracao-vem-ai.png',
    width: 1080,
    height: 1440,
    html: inauguracaoVemAiHTML('/images/pure-design/inauguracao-vem-ai.png'),
    fields: inauguracaoVemAiFields,
  },
  {
    id: 'inauguracao-melhor-hora',
    name: 'Inauguração — A melhor hora está chegando (com foto)',
    category: 'Inauguração',
    thumbnail: '/images/pure-design/inauguracao-melhor-hora.png',
    width: 1080,
    height: 1440,
    html: inauguracaoMelhorHoraHTML('/images/pure-design/inauguracao-melhor-hora.png'),
    fields: inauguracaoMelhorHoraFields,
  },
  {
    id: 'inauguracao-ja-tem-data',
    name: 'Inauguração — Já tem data',
    category: 'Inauguração',
    thumbnail: '/images/pure-design/inauguracao-ja-tem-data.png',
    width: 1080,
    height: 1440,
    html: inauguracaoJaTemDataHTML('/images/pure-design/inauguracao-ja-tem-data.png'),
    fields: inauguracaoJaTemDataFields,
  },
  {
    id: 'inauguracao-primeira-aula',
    name: 'Inauguração — Sua primeira aula',
    category: 'Inauguração',
    thumbnail: '/images/pure-design/inauguracao-primeira-aula.png',
    width: 1080,
    height: 1440,
    html: inauguracaoPrimeiraAulaHTML('/images/pure-design/inauguracao-primeira-aula.png'),
    fields: inauguracaoPrimeiraAulaFields,
  },
  {
    id: 'inauguracao-inauguramos',
    name: 'Inauguração — Inauguramos',
    category: 'Inauguração',
    thumbnail: '/images/pure-design/inauguracao-inauguramos.png',
    width: 1080,
    height: 1440,
    html: inauguracaoInauguramosHTML('/images/pure-design/inauguracao-inauguramos.png'),
    fields: inauguracaoInauguramosFields,
  },
  {
    id: 'pure-store-foto-fundo',
    name: 'Pure Store — Foto de fundo',
    category: 'Pure Store',
    thumbnail: '/images/pure-design/pure-store-coringa-bg.png',
    width: 1080,
    height: 1440,
    html: pureStoreFotoFundoHTML(molduraVaziaFoto),
    fields: pureStoreFotoFundoFields,
  },
  {
    id: 'pure-store-coringa',
    name: 'Pure Store — Coringa (1 a 3 fotos)',
    category: 'Pure Store',
    thumbnail: '/images/pure-design/pure-store-coringa-bg.png',
    width: 1080,
    height: 1440,
    html: pureStoreCoringaHTML('/images/pure-design/pure-store-coringa-bg.png'),
    fields: pureStoreCoringaFields,
    galeria: {
      token: '{{galeria}}',
      campos: ['foto1', 'foto2', 'foto3'],
      x: 72,
      y: 172,
      largura: 936,
      altura: 754,
      espaco: 19,
      raio: 24,
      fotoVazia: molduraVaziaFoto,
    },
  },
  {
    id: 'pure-store-tabela-precos',
    name: 'Pure Store — Tabela de Preços',
    category: 'Pure Store',
    thumbnail: '/images/pure-design/pure-store-tabela.png',
    width: 1488, // A4 retrato; a altura real cresce com o nº de linhas (ver table)
    height: 800, // baseHeight (com PIX)
    html: pureStoreHTML(),
    fields: pureStoreFields,
    table: {
      rowsToken: '<!--ROWS-->',
      catalog: pureStoreCatalog,
      placeholder: 'Selecionar',
      priceDefault: '000,00',
      initialRows: 8,
      rowHtml: pureStoreRowHtml,
      zebra: ['#FBF8F4', '#FBF8F4'],
      rowHeight: 66,
      baseHeight: 800,
      pixHeight: 204,
    },
  },
  {
    id: 'seja-instrutor',
    name: 'Seja Instrutor',
    category: 'Equipe',
    thumbnail: '/images/pure-design/seja-instrutor-bg-v4.png',
    width: 1080,
    height: 1440,
    html: sejaInstrutorHTML('/images/pure-design/seja-instrutor-bg-v4.png'),
    fields: sejaInstrutorFields,
  },
  {
    id: 'seja-instrutor-2',
    name: 'Seja Instrutor — Modelo 2',
    category: 'Equipe',
    thumbnail: '/images/pure-design/seja-instrutor-2-bg-v3.png',
    width: 1080,
    height: 1440,
    html: sejaInstrutorHTML('/images/pure-design/seja-instrutor-2-bg-v3.png'),
    fields: sejaInstrutorFields,
  },
  {
    id: 'aniversario-instrutor',
    name: 'Aniversário do Instrutor(a)',
    category: 'Equipe',
    thumbnail: '/images/pure-design/aniversario-instrutor-bg.png',
    width: 1080,
    height: 1080,
    html: aniversarioInstrutorHTML('/images/pure-design/aniversario-instrutor-bg.png', aniversarioInstrutorPlaceholderPhoto),
    fields: aniversarioInstrutorFields,
  },
  {
    id: 'dia-das-maes',
    name: 'Dia das Mães',
    category: 'Datas comemorativas',
    thumbnail: '/images/pure-design/dia-das-maes-bg-v2.png',
    width: 1080,
    height: 1440,
    html: diaDasMaesHTML('/images/pure-design/dia-das-maes-bg-v2.png'),
    fields: diaDasMaesFields,
  },
  {
    id: 'dia-das-maes-comemorativa',
    name: 'Dia das Mães',
    category: 'Datas comemorativas',
    thumbnail: '/images/pure-design/dia-das-maes-bg-v2.png',
    width: 1080,
    height: 1440,
    html: diaDasMaesHTML('/images/pure-design/dia-das-maes-bg-v2.png'),
    fields: diaDasMaesFields,
  },
  {
    id: 'dia-das-maes-50-off',
    name: 'Dupla Dinâmica 50% OFF',
    category: 'Datas comemorativas',
    thumbnail: '/images/pure-design/dia-das-maes-50-off.png',
    width: 1080,
    height: 1350,
    html: diaDasMaes50OffHTML('/images/pure-design/dia-das-maes-50-off.png'),
    fields: diaDasMaes50OffFields,
  },
  {
    id: 'a4-informativo',
    name: 'A4 Informativo',
    category: 'Avisos da unidade',
    thumbnail: '/images/pure-design/a4-base.png',
    width: 1410,
    height: 2000,
    html: a4InformativoHTML('/images/pure-design/a4-base.png'),
    fields: a4InformativoFields,
  },
  {
    id: 'feriado-aviso',
    name: 'Feriado — Aviso de Horário',
    category: 'Avisos da unidade',
    thumbnail: '/images/pure-design/feriado-aviso.png',
    width: 1080,
    height: 1350,
    html: feriadoAvisoHTML('/images/pure-design/pure-pilates-logo.png'),
    fields: [...feriadoAvisoFields, logoFeriadoAviso],
    repeat: feriadoAvisoRepeat,
  },
  {
    id: 'comunicado-copa',
    name: 'Copa — Clima de Torcida',
    category: 'Avisos da unidade',
    thumbnail: '/images/pure-design/comunicado-copa.png',
    width: 1080,
    height: 1350,
    html: comunicadoCopaHTML('/images/pure-design/comunicado-copa.png'),
    fields: comunicadoCopaFields,
  },
  {
    id: 'vale-presente',
    name: 'Vale Presente',
    category: 'Vale-presente',
    thumbnail: '/images/pure-design/vale-presente.png',
    width: 1512,
    height: 662,
    html: valePresenteHTML('/images/pure-design/pure-pilates-logo-trim.png'),
    fields: valePresenteFields,
  },
  {
    id: 'depoimento-claro',
    name: 'Depoimento — Card claro',
    category: 'Alunos e comunidade',
    thumbnail: '/images/pure-design/depoimento-claro.png',
    width: 1080,
    height: 1350,
    html: depoimentoClaroHTML('/images/pure-design/pure-pilates-logo-trim.png', depoimentoPlaceholderFoto),
    fields: [...depoimentoClaroFields, logoDepoimentoClaro],
  },
  {
    id: 'depoimento-vermelho',
    name: 'Depoimento — Fundo vermelho',
    category: 'Alunos e comunidade',
    thumbnail: '/images/pure-design/depoimento-vermelho.png',
    width: 1080,
    height: 1350,
    html: depoimentoVermelhoHTML('/images/pure-design/pure-pilates-logo-trim.png', depoimentoPlaceholderFoto),
    fields: [...depoimentoVermelhoFields, logoDepoimentoVermelho],
  },
];

/**
 * Palavras-chave de cada modelo, para o assistente achar o modelo pronto pelo
 * que a pessoa escreveu. Sem acento e em minúsculas; vale pedaço de palavra
 * ("inaugur" pega inauguração, inaugurar, inauguramos).
 * MODELO NOVO: acrescente aqui as palavras que alguém usaria para pedi-lo.
 */
const PALAVRAS_CHAVE: Record<string, string[]> = {
  // As duas "padrão" de inauguração: qualquer pedido de inauguração/abertura cai nelas.
  'inauguracao-vem-ai': [
    'inaugur', 'abertura', 'abrir', 'nova unidade', 'novo estudio', 'estudio novo', 'vem ai', 'em breve', 'chegando',
  ],
  'inauguracao-melhor-hora': [
    'inaugur', 'abertura', 'abrir', 'nova unidade', 'novo estudio', 'estudio novo', 'melhor hora', 'chegando',
  ],
  // As específicas: só quando a pessoa usa essas expressões.
  'inauguracao-ja-tem-data': ['ja tem data', 'data da inauguracao', 'save the date', 'dia da inauguracao'],
  'inauguracao-primeira-aula': ['primeira aula', 'aula inaugural'],
  'inauguracao-inauguramos': ['inauguramos', 'inaugurada', 'abrimos', 'ja abriu', 'estamos abertos'],
  'pure-store-foto-fundo': [
    'pure store', 'loja', 'store', 'pre-venda', 'pre venda', 'lancamento', 'colecao', 'move', 'ultimos dias',
    'garanta', 'pedido', 'chegando', 'foto de fundo', 'campanha', 'promocao',
  ],
  'pure-store-coringa': [
    'pure store', 'loja', 'store', 'pre-venda', 'pre venda', 'lancamento', 'colecao', 'novidade', 'chegou',
    'peca', 'roupa', 'look', 'produto', 'top', 'legging', 'camiseta', 'short', 'black friday', 'promocao',
  ],
  'pure-store-tabela-precos': ['pure store', 'tabela', 'preco', 'produto', 'loja', 'uniforme', 'meia', 'garrafa'],
  'seja-instrutor': ['instrutor', 'vaga', 'contrat', 'recrut', 'seja instrutor', 'trabalhe', 'professor'],
  'seja-instrutor-2': ['instrutor', 'vaga', 'contrat', 'recrut', 'seja instrutor', 'trabalhe', 'professor'],
  'aniversario-instrutor': ['aniversari', 'parabens', 'niver', 'instrutor', 'professor', 'professora', 'instrutora'],
  'dia-das-maes': ['mae', 'maes', 'dia das maes'],
  'dia-das-maes-comemorativa': ['mae', 'maes', 'dia das maes'],
  'dia-das-maes-50-off': ['mae', 'maes', 'dupla', '50%', 'desconto', 'promocao'],
  'a4-informativo': ['comunicado', 'informativo', 'aviso', 'a4', 'mural', 'impresso', 'recado'],
  'feriado-aviso': [
    'feriado', 'corpus christi', 'horario', 'funcionamento', 'fechad', 'aberto', 'recesso', 'emenda', 'ponte',
    'natal', 'ano novo', 'reveillon', 'carnaval', 'pascoa', 'tiradentes', 'independencia',
    'proclamacao', 'consciencia negra', 'finados', 'aparecida', 'trabalhador',
  ],
  'comunicado-copa': ['copa', 'jogo', 'brasil', 'torcida', 'futebol', 'selecao'],
  'vale-presente': ['vale presente', 'vale-presente', 'presente', 'gift', 'voucher', 'cartao presente'],
  'depoimento-claro': ['depoimento', 'avaliacao', 'feedback', 'aluno disse', 'opiniao', 'review'],
  'depoimento-vermelho': ['depoimento', 'avaliacao', 'feedback', 'aluno disse', 'opiniao', 'review'],
};
/**
 * O que cada CATEGORIA cobre, em linguagem de gente: é assim que o assistente do
 * Pure Design entende o pedido ("arte para o meu estúdio dia 19/11" → é uma
 * inauguração?) e decide quando perguntar. CATEGORIA NOVA: escreva aqui quando
 * ela serve e que palavras/situações levam a ela.
 */
export const CATEGORIAS: Record<string, string> = {
  'Inauguração':
    'Artes para a abertura de uma unidade/estúdio novo: anunciar que vai abrir (vem aí, em breve), a data da inauguração, a primeira aula e o "inauguramos" depois de abrir. A pessoa pode dizer "abertura do estúdio", "estúdio novo", "nova unidade", "vamos abrir dia tal".',
  'Atrair alunos':
    'Captação de alunos: convite para aula experimental (com ou sem foto), programa de indicação (indique um amigo) e Black Friday / condição especial de planos da unidade (sem inventar preço).',
  'Avisos da unidade':
    'Avisos de funcionamento: feriado (dias que fecha/abre, com mensagem opcional de bom feriado), mudança de horário, aula cancelada, manutenção, comunicado impresso A4 e dias de jogo.',
  'Aulas e eventos':
    'Programação da unidade: grade de horários da semana, aulão do mês, aula aberta, workshop, evento.',
  'Equipe':
    'Equipe da unidade. "Vaga", "contratando", "trabalhe conosco" = vaga de INSTRUTOR(A) DE PILATES (assuma sem perguntar o cargo; só mude se a pessoa disser outro). Também: novo instrutor na equipe e aniversário de instrutor(a).',
  'Alunos e comunidade':
    'Relação com os alunos: depoimento de aluno, boas-vindas a aluno novo, aniversariantes do mês.',
  'Feriados 2027':
    'Um aviso pronto para cada feriado de 2027 (Ano-Novo, Carnaval, Quarta de Cinzas, Sexta-feira Santa, Tiradentes, Dia do Trabalho, Corpus Christi, 9 de julho em SP, Independência, Aparecida, Finados, República, Consciência Negra, véspera de Natal, Natal e véspera de Ano-Novo), com a ilustração do tema e a data já preenchida. Quando o pedido é sobre um desses feriados, use o modelo da data em vez do aviso de feriado genérico.',
  'Recesso de fim de ano':
    'Comunicado de recesso de fim de ano (unidade fechada entre o Natal e o começo do ano): agradecimento pelo ano, período do recesso, data da volta e boas festas. Em quatro formatos: A4 para imprimir, feed, stories e quadrado.',
  'Datas comemorativas':
    'Mensagens de datas especiais: Natal e Ano Novo (com ou sem foto), Dia das Mães (homenagem e Dupla Dinâmica).',
  'Pure Store':
    'Produtos da Pure Store vendidos na unidade: vitrine com galeria de 1 a 3 fotos, campanha com foto de fundo e tabela de preços.',
  'Vale-presente': 'Vale-presente / cartão-presente de aulas, para presentear alguém.',
  'Coringas':
    'Modelos genéricos, com título e texto livres (só texto, com uma foto ou com duas fotos), para qualquer assunto que as outras categorias não cobrem bem.',
};

/** Ordem das categorias na galeria do Pure Design. */
export const ORDEM_DAS_CATEGORIAS = [
  'Inauguração',
  'Atrair alunos',
  'Avisos da unidade',
  'Feriados 2027',
  'Recesso de fim de ano',
  'Aulas e eventos',
  'Equipe',
  'Alunos e comunidade',
  'Datas comemorativas',
  'Pure Store',
  'Vale-presente',
  'Coringas',
];

/** O que é cada modelo, em uma frase, para o assistente diferenciar modelos do mesmo tema. */
const DICAS: Record<string, string> = {
  'inauguracao-vem-ai':
    'O anúncio principal de inauguração, sem foto ("vem aí uma nova Pure"). É o mais usado quando a arte é sem foto.',
  'inauguracao-melhor-hora':
    'O anúncio principal de inauguração com foto do estúdio. É o mais usado quando a pessoa tem foto.',
  'inauguracao-ja-tem-data': 'Anuncia que a inauguração já tem data marcada ("save the date").',
  'inauguracao-primeira-aula': 'Convite para a primeira aula / aula inaugural da unidade nova.',
  'inauguracao-inauguramos': 'Para depois da inauguração: "inauguramos", "abrimos".',
  'pure-store-foto-fundo':
    'Campanha da Pure Store com UMA foto ocupando a arte inteira (obrigatória: peça a foto antes), etiqueta opcional no alto e um cartão com chamada pequena, título, texto e botão (ex.: "Garanta já seus pedidos"). Para lançamento, pré-venda, últimos dias de campanha.',
  'pure-store-coringa':
    'O coringa da Pure Store: vitrine com GALERIA de 1 a 3 fotos de produtos (o layout se ajusta à quantidade), título, texto, logo e uma etiqueta opcional (ex.: "Pré-venda", "Lançamento", "Novidade"; vazia = sem etiqueta). Serve para qualquer divulgação de produtos da loja.',
  'feriado-aviso':
    'Aviso de funcionamento em qualquer feriado, com a lista de datas (fechado/aberto) e uma mensagem opcional de bom feriado (ex.: "Desejamos um ótimo feriado!"). Sem foto.',
};
for (const t of pureDesignTemplates) {
  t.palavrasChave = PALAVRAS_CHAVE[t.id] ?? PALAVRAS_MODELOS_NOVOS[t.id] ?? PALAVRAS_FERIADOS_2027[t.id] ?? PALAVRAS_RECESSO[t.id];
  t.dica = DICAS[t.id] ?? DICAS_MODELOS_NOVOS[t.id] ?? DICAS_FERIADOS_2027[t.id] ?? DICAS_RECESSO[t.id];
}

// Fica true quando o template demarca o bloco removível do campo (forma + texto)
// via <!--fld:ID-->...<!--/fld:ID-->. Só nesses campos o editor mostra a lixeira.
export function fieldIsRemovable(template: PureDesignTemplate, fieldId: string): boolean {
  if (template.galeria?.campos.includes(fieldId)) return true;
  return template.html.includes(`<!--fld:${fieldId}-->`);
}

/** Altura do canvas e do card de um template `repeat`, dada a contagem de itens. */
export function computeRepeatHeights(cfg: RepeatConfig, count: number) {
  const extra = Math.max(0, count - cfg.baseCount) * cfg.step;
  return { canvasHeight: cfg.baseCanvasHeight + extra, cardHeight: cfg.baseCardHeight + extra };
}

export function buildRenderedHTML(
  template: PureDesignTemplate,
  values: Record<string, string>,
  removed?: ReadonlySet<string>,
  rows?: readonly TableRow[],
  repeatItems?: readonly RepeatItem[],
): string {
  let html = template.html;
  // Remove o bloco inteiro (forma + texto) dos campos marcados como excluídos.
  if (removed) {
    removed.forEach((id) => {
      const re = new RegExp(`<!--fld:${id}-->[\\s\\S]*?<!--/fld:${id}-->`, 'g');
      html = html.replace(re, '');
    });
  }
  html = emoldurarFotos(html, template, values);
  if (template.galeria) {
    html = html.split(template.galeria.token).join(montarGaleria(template.galeria, values, removed));
  }
  template.fields.forEach((field) => {
    // Logo: o estilo (canto, distâncias, tamanho) entra antes, pelo token próprio.
    if (field.inputType === 'logo' && field.logoCaixa) {
      html = html.split(`{{${field.id}:estilo}}`).join(estiloDoLogo(field.id, field.logoCaixa, values));
    }
    // Campo removido sem marcador de bloco: pelo menos zera o texto.
    const bruto = removed?.has(field.id) ? '' : (values[field.id] ?? field.defaultValue);
    const ehTexto = field.inputType !== 'image' && field.inputType !== 'logo';
    const value = ehTexto ? textoDoCampo(field.id, bruto, values) : bruto;
    html = html.split(field.placeholder).join(value);
  });
  // Tabela de linhas dinâmicas (Pure Store): gera uma linha por item escolhido.
  if (template.table) {
    const t = template.table;
    const generated = (rows ?? [])
      .map((row, i) => {
        const item = (row.item ?? '').trim() || t.placeholder;
        const preco = (row.preco ?? '').trim() || t.priceDefault;
        return t.rowHtml
          .split('{{bg}}').join(t.zebra[i % 2])
          .split('{{item}}').join(item)
          .split('{{preco}}').join(preco);
      })
      .join('');
    html = html.split(t.rowsToken).join(generated);
  }
  // Lista dinâmica de pills (Aviso de Feriado): datas com variante e altura viva.
  if (template.repeat) {
    const cfg = template.repeat;
    const items = repeatItems ?? cfg.initial;
    const { canvasHeight, cardHeight } = computeRepeatHeights(cfg, items.length);
    html = html.split(cfg.canvasHeightToken).join(String(canvasHeight));
    html = html.split(cfg.cardHeightToken).join(String(cardHeight));
    const generated = items
      .map((item) => {
        const variant = cfg.variants.find((v) => v.id === item.variant) ?? cfg.variants[0];
        const text = (item.text ?? '').trim() || ' ';
        return variant.html.split('{{text}}').join(text);
      })
      .join('');
    html = html.split(cfg.token).join(generated);
  }
  return html;
}
