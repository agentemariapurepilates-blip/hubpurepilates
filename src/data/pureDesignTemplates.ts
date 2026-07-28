export interface TemplateField {
  id: string;
  label: string;
  placeholder: string;
  defaultValue: string;
  inputType?: 'input' | 'textarea' | 'image';
  maxLength?: number;
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
}

const sejaInstrutorHTML = (bgUrl: string) => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Seja Instrutor</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
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
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
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
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
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
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700;800&display=swap" rel="stylesheet">
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
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
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

const feriadoCorpusChristiHTML = (bgUrl: string) => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Feriado de Corpus Christi</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#f0f0f0;">
<div style="position:relative; width:1080px; height:1350px; background-image:url('${bgUrl}'); background-size:cover; background-position:center; overflow:hidden; font-family:Montserrat, Arial, sans-serif;">
<div style="position:absolute; left:170px; right:140px; top:700px; text-align:center;">
<div style="margin-bottom:12px;"><span style="display:inline-block; height:46px; line-height:46px; padding:0 26px; background:#c41230; color:#ffffff; border-radius:999px; font-size:24px; font-weight:600; letter-spacing:1px; white-space:nowrap; box-sizing:border-box; vertical-align:top;">{{data1}}</span></div>
<div><span style="display:inline-block; height:46px; line-height:46px; padding:0 26px; background:#c41230; color:#ffffff; border-radius:999px; font-size:24px; font-weight:600; letter-spacing:1px; white-space:nowrap; box-sizing:border-box; vertical-align:top;">{{data2}}</span></div>
</div>
</div>
</body>
</html>`;

const feriadoCorpusChristiFields: TemplateField[] = [
  { id: 'data1', label: 'Data 1 — status', placeholder: '{{data1}}', defaultValue: '04/06 - FECHADO', maxLength: 30 },
  { id: 'data2', label: 'Data 2 — status', placeholder: '{{data2}}', defaultValue: '05/06 - ABERTO', maxLength: 30 },
];

const comunicadoCopaHTML = (bgUrl: string) => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Comunicado Copa — Clima de Torcida</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
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
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
</head>
<body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#f0f0f0;">
<div style="position:relative; width:1080px; height:1350px; background:linear-gradient(180deg,#ffffff 0%,#f1f1f1 100%); overflow:hidden; font-family:Montserrat, Arial, sans-serif;">

<!-- Forma pétala decorativa (marca) -->
<svg width="440" height="440" viewBox="0 0 250 250" style="position:absolute; top:-150px; right:-140px;"><path d="M 125 0 L 125 0 A 125 125 0 0 1 250 125 L 250 250 L 125 250 A 125 125 0 0 1 0 125 L 0 125 A 125 125 0 0 1 125 0 Z" fill="none" stroke="#C12030" stroke-width="3" opacity="0.30"/></svg>
<svg width="440" height="440" viewBox="0 0 250 250" style="position:absolute; bottom:-150px; left:-140px;"><path d="M 0 0 L 125 0 A 125 125 0 0 1 250 125 L 250 125 A 125 125 0 0 1 125 250 L 0 250 L 0 0 Z" fill="none" stroke="#DB9828" stroke-width="3" opacity="0.35"/></svg>
<svg width="300" height="300" viewBox="0 0 250 250" style="position:absolute; top:150px; left:-130px;"><path d="M 125 0 L 125 0 A 125 125 0 0 1 250 125 L 250 250 L 125 250 A 125 125 0 0 1 0 125 L 0 125 A 125 125 0 0 1 125 0 Z" fill="none" stroke="#C12030" stroke-width="3" opacity="0.22"/></svg>
<svg width="260" height="260" viewBox="0 0 250 250" style="position:absolute; bottom:120px; right:-110px;"><path d="M 0 0 L 125 0 A 125 125 0 0 1 250 125 L 250 125 A 125 125 0 0 1 125 250 L 0 250 L 0 0 Z" fill="none" stroke="#DB9828" stroke-width="3" opacity="0.25"/></svg>

<!-- Logo -->
<img src="${logoUrl}" alt="Pure Pilates" style="position:absolute; top:36px; left:50%; transform:translateX(-50%); width:180px; height:auto; display:block;"/>

<!-- AVISO! -->
<!--fld:aviso--><div style="position:absolute; top:220px; left:0; right:0; text-align:center; font-size:132px; font-weight:800; color:#C12030; letter-spacing:2px; line-height:1;">{{aviso}}</div><!--/fld:aviso-->

<!-- Card (forma-assinatura Pure: 3 cantos arredondados + 1 reto) -->
<div style="position:absolute; left:165px; top:445px; width:750px; height:460px; box-sizing:border-box; border:7px solid #C12030; border-radius:58px 58px 0 58px; background:rgba(255,255,255,0.55);"></div>

<!-- Conteúdo do card (centralizado) -->
<div style="position:absolute; left:165px; top:445px; width:750px; height:460px; box-sizing:border-box; padding:0 56px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center;">
  <!--fld:titulo--><div style="margin-bottom:24px;"><span style="display:inline-block; background:#1a1a1a; color:#ffffff; padding:13px 32px; border-radius:30px 30px 0 30px; font-size:28px; font-weight:700; letter-spacing:1px; text-transform:uppercase; line-height:1.25;">{{titulo}}</span></div><!--/fld:titulo-->
  <!--fld:subtitulo--><div style="font-size:25px; font-weight:700; color:#C12030; text-transform:uppercase; letter-spacing:0.5px; line-height:1.35; margin-bottom:36px;">{{subtitulo}}</div><!--/fld:subtitulo-->
  <!--fld:data1--><div style="margin-bottom:18px;"><span style="display:inline-block; width:330px; box-sizing:border-box; text-align:center; background:#C12030; color:#ffffff; padding:13px 16px; border-radius:999px; font-size:27px; font-weight:700; letter-spacing:0.5px; white-space:nowrap;">{{data1}}</span></div><!--/fld:data1-->
  <!--fld:data2--><div><span style="display:inline-block; width:330px; box-sizing:border-box; text-align:center; background:#ffffff; color:#C12030; border:3px solid #C12030; padding:10px 16px; border-radius:999px; font-size:27px; font-weight:700; letter-spacing:0.5px; white-space:nowrap;">{{data2}}</span></div><!--/fld:data2-->
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
  { id: 'data1', label: 'Data 1 — status', placeholder: '{{data1}}', defaultValue: '09/07 - Fechado', maxLength: 30 },
  { id: 'data2', label: 'Data 2 — status', placeholder: '{{data2}}', defaultValue: '10/07 - Aberto', maxLength: 30 },
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
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
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
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap" rel="stylesheet">
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
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap" rel="stylesheet">
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
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap" rel="stylesheet">
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
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap" rel="stylesheet">
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
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap" rel="stylesheet">
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

export const pureDesignTemplates: PureDesignTemplate[] = [
  {
    id: 'inauguracao-vem-ai',
    name: 'Inauguração — Vem aí uma nova',
    category: 'Inauguração',
    thumbnail: '/images/pure-design/inauguracao-vem-ai.png',
    width: 1080,
    height: 1440,
    html: inauguracaoVemAiHTML('/images/pure-design/inauguracao-vem-ai.png'),
    fields: inauguracaoVemAiFields,
  },
  {
    id: 'inauguracao-melhor-hora',
    name: 'Inauguração — A melhor hora está chegando',
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
    category: 'Recrutamento',
    thumbnail: '/images/pure-design/seja-instrutor-bg-v4.png',
    width: 1080,
    height: 1440,
    html: sejaInstrutorHTML('/images/pure-design/seja-instrutor-bg-v4.png'),
    fields: sejaInstrutorFields,
  },
  {
    id: 'seja-instrutor-2',
    name: 'Seja Instrutor — Modelo 2',
    category: 'Recrutamento',
    thumbnail: '/images/pure-design/seja-instrutor-2-bg-v3.png',
    width: 1080,
    height: 1440,
    html: sejaInstrutorHTML('/images/pure-design/seja-instrutor-2-bg-v3.png'),
    fields: sejaInstrutorFields,
  },
  {
    id: 'aniversario-instrutor',
    name: 'Aniversário do Instrutor(a)',
    category: 'Datas Comemorativas',
    thumbnail: '/images/pure-design/aniversario-instrutor-bg.png',
    width: 1080,
    height: 1080,
    html: aniversarioInstrutorHTML('/images/pure-design/aniversario-instrutor-bg.png', aniversarioInstrutorPlaceholderPhoto),
    fields: aniversarioInstrutorFields,
  },
  {
    id: 'dia-das-maes',
    name: 'Dia das Mães',
    category: 'Dia das mães',
    thumbnail: '/images/pure-design/dia-das-maes-bg-v2.png',
    width: 1080,
    height: 1440,
    html: diaDasMaesHTML('/images/pure-design/dia-das-maes-bg-v2.png'),
    fields: diaDasMaesFields,
  },
  {
    id: 'dia-das-maes-comemorativa',
    name: 'Dia das Mães',
    category: 'Datas Comemorativas',
    thumbnail: '/images/pure-design/dia-das-maes-bg-v2.png',
    width: 1080,
    height: 1440,
    html: diaDasMaesHTML('/images/pure-design/dia-das-maes-bg-v2.png'),
    fields: diaDasMaesFields,
  },
  {
    id: 'dia-das-maes-50-off',
    name: 'Dupla Dinâmica 50% OFF',
    category: 'Dia das mães',
    thumbnail: '/images/pure-design/dia-das-maes-50-off.png',
    width: 1080,
    height: 1350,
    html: diaDasMaes50OffHTML('/images/pure-design/dia-das-maes-50-off.png'),
    fields: diaDasMaes50OffFields,
  },
  {
    id: 'a4-informativo',
    name: 'A4 Informativo',
    category: 'Informativos',
    thumbnail: '/images/pure-design/a4-base.png',
    width: 1410,
    height: 2000,
    html: a4InformativoHTML('/images/pure-design/a4-base.png'),
    fields: a4InformativoFields,
  },
  {
    id: 'feriado-corpus-christi',
    name: 'Feriado — Corpus Christi',
    category: 'Feriados',
    thumbnail: '/images/pure-design/feriado-corpus-christi.png',
    width: 1080,
    height: 1350,
    html: feriadoCorpusChristiHTML('/images/pure-design/feriado-corpus-christi.png'),
    fields: feriadoCorpusChristiFields,
  },
  {
    id: 'feriado-aviso',
    name: 'Feriado — Aviso de Horário',
    category: 'Feriados',
    thumbnail: '/images/pure-design/feriado-aviso.png',
    width: 1080,
    height: 1350,
    html: feriadoAvisoHTML('/images/pure-design/pure-pilates-logo.png'),
    fields: feriadoAvisoFields,
  },
  {
    id: 'comunicado-copa',
    name: 'Copa — Clima de Torcida',
    category: 'Comunicados',
    thumbnail: '/images/pure-design/comunicado-copa.png',
    width: 1080,
    height: 1350,
    html: comunicadoCopaHTML('/images/pure-design/comunicado-copa.png'),
    fields: comunicadoCopaFields,
  },
];

// Fica true quando o template demarca o bloco removível do campo (forma + texto)
// via <!--fld:ID-->...<!--/fld:ID-->. Só nesses campos o editor mostra a lixeira.
export function fieldIsRemovable(template: PureDesignTemplate, fieldId: string): boolean {
  return template.html.includes(`<!--fld:${fieldId}-->`);
}

export function buildRenderedHTML(
  template: PureDesignTemplate,
  values: Record<string, string>,
  removed?: ReadonlySet<string>,
  rows?: readonly TableRow[],
): string {
  let html = template.html;
  // Remove o bloco inteiro (forma + texto) dos campos marcados como excluídos.
  if (removed) {
    removed.forEach((id) => {
      const re = new RegExp(`<!--fld:${id}-->[\\s\\S]*?<!--/fld:${id}-->`, 'g');
      html = html.replace(re, '');
    });
  }
  template.fields.forEach((field) => {
    // Campo removido sem marcador de bloco: pelo menos zera o texto.
    const value = removed?.has(field.id) ? '' : (values[field.id] ?? field.defaultValue);
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
  return html;
}
