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
<p style="font-size:34px; font-weight:700; color:#777777; margin-top:5px; transform:translateX(20px);">{{dias}}</p>
<p style="font-size:34px; font-weight:700; color:#777777; margin-top:5px; transform:translateX(20px);">{{horario}}</p>
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
