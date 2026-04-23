export interface TemplateField {
  id: string;
  label: string;
  placeholder: string;
  defaultValue: string;
  inputType?: 'input' | 'textarea';
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

const sejaInstrutorHTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Seja Instrutor</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
</head>
<body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#f0f0f0;">
<div style="position:relative; width:1080px; height:1440px; background:#e8e8e8; background-image:url('/images/pure-design/seja-instrutor-bg-v2.png'); background-size:cover; background-position:center; overflow:hidden; font-family:Montserrat, sans-serif;">
<div style="position:absolute; right:80px; top:180px; width:420px; text-align:right;">
<h1 style="font-size:82px; font-weight:800; color:#1a1a1a; letter-spacing:6px; margin:0; line-height:1;">{{titulo1}}</h1>
<h1 style="font-size:68px; font-weight:800; color:#c41230; letter-spacing:6px; margin:0; line-height:1;">{{titulo2}}</h1>
<p style="font-size:32px; color:#555555; margin-top:35px;">{{subtitulo}}</p>
<p style="font-size:40px; font-weight:700; color:#1a1a1a; margin-top:10px;">{{cargo}}</p>
<p style="font-size:28px; font-weight:700; color:#c41230; margin-top:5px; transform:translateX(20px);">{{localizacao}}</p>
<p style="font-size:28px; color:#777777; margin-top:5px;">{{horario}}</p>
<p style="font-size:22px; color:#666666; line-height:1.4; margin-top:25px;">{{descricao}}</p>
<p style="font-size:26px; font-weight:600; color:#c41230; margin-top:40px;">{{email}}</p>
<p style="font-size:26px; font-weight:600; color:#c41230; margin-top:6px;">{{telefone}}</p>
</div>
</div>
</body>
</html>`;

export const pureDesignTemplates: PureDesignTemplate[] = [
  {
    id: 'seja-instrutor',
    name: 'Seja Instrutor',
    category: 'Recrutamento',
    thumbnail: '/images/pure-design/seja-instrutor-bg-v2.png',
    width: 1080,
    height: 1440,
    html: sejaInstrutorHTML,
    fields: [
      { id: 'titulo1', label: 'Título linha 1', placeholder: '{{titulo1}}', defaultValue: 'SEJA', maxLength: 8 },
      { id: 'titulo2', label: 'Título linha 2', placeholder: '{{titulo2}}', defaultValue: 'INSTRUTOR', maxLength: 10 },
      { id: 'subtitulo', label: 'Subtítulo', placeholder: '{{subtitulo}}', defaultValue: 'Venha fazer parte do nosso time', maxLength: 35 },
      { id: 'cargo', label: 'Cargo', placeholder: '{{cargo}}', defaultValue: 'Instrutor(a) de Pilates', maxLength: 30 },
      { id: 'localizacao', label: 'Localização', placeholder: '{{localizacao}}', defaultValue: 'São Paulo, SP — Presencial', maxLength: 70 },
      { id: 'horario', label: 'Horário', placeholder: '{{horario}}', defaultValue: 'Das 07:00 às 14:00', maxLength: 50 },
      { id: 'descricao', label: 'Descrição', placeholder: '{{descricao}}', defaultValue: 'Procuramos profissional com formação completa em Pilates para conduzir aulas em grupo e individuais.', inputType: 'textarea', maxLength: 200 },
      { id: 'email', label: 'E-mail de contato', placeholder: '{{email}}', defaultValue: 'contato@purepilates.com.br', maxLength: 40 },
      { id: 'telefone', label: 'Telefone / WhatsApp', placeholder: '{{telefone}}', defaultValue: '(11) 99999-9999', maxLength: 25 },
    ],
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
