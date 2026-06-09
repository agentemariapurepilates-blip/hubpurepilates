export interface TemplateField {
  id: string;
  label: string;
  placeholder: string;
  defaultValue: string;
  inputType?: 'input' | 'textarea' | 'image';
  maxLength?: number;
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

export const pureDesignTemplates: PureDesignTemplate[] = [
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

export function buildRenderedHTML(
  template: PureDesignTemplate,
  values: Record<string, string>,
): string {
  let html = template.html;
  template.fields.forEach((field) => {
    const value = values[field.id] ?? field.defaultValue;
    html = html.split(field.placeholder).join(value);
  });
  return html;
}
