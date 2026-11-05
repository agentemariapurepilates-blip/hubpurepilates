// Modelo do e-mail dos pedidos de MÍDIA LOCAL na TV Globo, enviado à Rise.
//
// O e-mail é montado no n8n (workflow "Midia local TV Globo - Notificacao por
// email", webhook `midia-local-email`). Este arquivo é a FONTE do HTML e do
// assunto que vão no nó Gmail, e gera também a prévia.
//
//   node n8n/midia-local-email.mjs            → imprime o modelo do n8n
//   node n8n/midia-local-email.mjs --previa   → imprime a prévia (HTML)
//
// A PRÉVIA É O PRÓPRIO MODELO EXECUTADO com dados de exemplo (cada {{ ... }} é
// avaliado como o n8n avalia). Não existe uma segunda versão do HTML para
// divergir: o que a prévia mostra é o que o n8n envia.
//
// QUEM LÊ É A RISE, FORA DO HUB: por isso não há botão "Ver no Hub" (ela não tem
// login) e o e-mail diz, no topo, que responder fala direto com o franqueado —
// o "responder para" do Gmail é o e-mail dele (campo `responder_para`).
//
// IDENTIDADE (conferida no código): vermelho #c5203c, preto #1a1a1a, Montserrat
// nos títulos e Inter no corpo. Tabelas e estilo inline (cliente de e-mail não
// aceita flex/grid nem CSS externo), sem imagem remota (Gmail e Outlook
// bloqueiam), webfont como best-effort com alternativas próximas.
//
// Tudo que o franqueado digita passa por escape: sem isso, "<b>" no nome da
// unidade ou no texto do criativo viraria HTML dentro do e-mail.

import { pathToFileURL } from 'node:url';

const VERMELHO = '#c5203c';
const PRETO = '#1a1a1a';
const CINZA = '#6b7076';
const CINZA_CLARO = '#8a9099';
const LINHA = '#e6e8eb';
const FUNDO = '#f4f5f7';
const ROSADO = '#fbeef1';
const ALERTA = '#fff6e5';
const ALERTA_BORDA = '#f0d9a8';

const CORPO = "'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const TITULO = "'Montserrat','Segoe UI','Helvetica Neue',Helvetica,Arial,sans-serif";

// Escape de HTML como expressão do n8n.
const ESCAPA = ".replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;')";

/** Um campo do corpo do webhook, com escape. `vazio` é o que aparece se faltar. */
const campo = (nome, vazio = '—') =>
  `{{ (String($json.body.${nome} ?? '')${ESCAPA}) || '${vazio}' }}`;

/** Um campo de texto livre: preserva as quebras de linha que a pessoa digitou. */
const campoLivre = (nome) =>
  `{{ (String($json.body.${nome} ?? '')${ESCAPA}).replace(/\\n/g,'<br>') || '—' }}`;

/** Duas coisas juntas numa linha só: o objetivo e, se for inauguração, a data. */
const objetivo =
  `{{ (String($json.body.objetivo_label ?? '') + ($json.body.data_inauguracao_fmt ? ' · prevista para ' + $json.body.data_inauguracao_fmt : ''))${ESCAPA} }}`;

const avisoAncine =
  `{{ $json.body.ancine ? \`<tr><td style="padding:22px 32px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${ALERTA};border:1px solid ${ALERTA_BORDA};border-radius:10px;"><tr><td style="padding:14px 18px;font-family:${CORPO};font-size:13px;line-height:1.55;color:${PRETO};"><strong>Adaptação de campanha: tem custo de Ancine</strong>, calculado à parte. O marketing da Pure recebeu cópia deste e-mail.</td></tr></table></td></tr>\` : '' }}`;

const linha = (rotulo, valor) => `
          <tr>
            <td style="padding:11px 0 0;font-family:${CORPO};font-size:12px;color:${CINZA_CLARO};width:150px;vertical-align:top;">${rotulo}</td>
            <td style="padding:11px 0 0;font-family:${CORPO};font-size:14px;font-weight:500;line-height:1.5;color:${PRETO};">${valor}</td>
          </tr>`;

const secao = (titulo, linhas) => `
      <tr><td style="padding:24px 32px 0;">
        <p style="margin:0 0 4px;font-family:${CORPO};font-size:11px;font-weight:600;letter-spacing:1.2px;text-transform:uppercase;color:${VERMELHO};">${titulo}</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${LINHA};">${linhas}
        </table>
      </td></tr>`;

export function montarModelo() {
  return `<style>@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&family=Inter:wght@400;500;600&display=swap');</style>
<body style="margin:0;padding:0;background-color:${FUNDO};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${FUNDO};">
  <tr><td align="center" style="padding:28px 12px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:14px;overflow:hidden;">

      <tr><td style="height:5px;line-height:5px;font-size:0;background-color:${VERMELHO};">&nbsp;</td></tr>

      <tr><td style="padding:22px 32px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="font-family:${TITULO};font-size:13px;font-weight:800;letter-spacing:2.2px;color:${VERMELHO};">PURE PILATES</td>
            <td align="right" style="font-family:${CORPO};font-size:11px;letter-spacing:0.6px;color:${CINZA_CLARO};">Mídia local · TV Globo</td>
          </tr>
        </table>
      </td></tr>

      <tr><td style="padding:28px 32px 0;">
        <p style="margin:0 0 10px;font-family:${CORPO};font-size:11px;font-weight:600;letter-spacing:1.4px;text-transform:uppercase;color:${VERMELHO};">Novo pedido · Mídia local na TV Globo</p>
        <h1 style="margin:0 0 8px;font-family:${TITULO};font-size:28px;line-height:1.25;font-weight:700;letter-spacing:-0.4px;color:${PRETO};">${campo('nome_unidade')}</h1>
        <p style="margin:0;font-family:${CORPO};font-size:15px;line-height:1.55;color:${CINZA};"><strong style="color:${PRETO};">Responder este e-mail fala direto com o franqueado</strong> (${campo('nome_franqueado')}).</p>
      </td></tr>

      <tr><td style="padding:24px 32px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${ROSADO};border-radius:10px;">
          <tr>
            <td width="62%" style="padding:18px 20px;border-right:1px solid #f1d3da;vertical-align:top;">
              <p style="margin:0 0 4px;font-family:${CORPO};font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:${CINZA};">Quer contratar</p>
              <p style="margin:0;font-family:${TITULO};font-size:17px;line-height:1.4;font-weight:800;color:${VERMELHO};">${campo('produtos_texto')}</p>
            </td>
            <td width="38%" style="padding:18px 20px;vertical-align:top;">
              <p style="margin:0 0 4px;font-family:${CORPO};font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:${CINZA};">Veiculação desejada</p>
              <p style="margin:0;font-family:${TITULO};font-size:15px;line-height:1.4;font-weight:700;color:${PRETO};">${campo('periodo_fmt')}</p>
            </td>
          </tr>
        </table>
      </td></tr>
${avisoAncine}
${secao('Franqueado', linha('Nome', campo('nome_franqueado')) + linha('E-mail', campo('email_franqueado')) + linha('Telefone', campo('telefone_fmt')))}
${secao('Praça', linha('Unidade', campo('nome_unidade')) + linha('Endereço', campo('endereco_unidade')) + linha('CEP', campo('cep')) + linha('Objetivo', objetivo))}
${secao('Criativo', linha('Tipo', campo('criativo_label')) + linha('A adequar', campoLivre('criativo_info')))}
${secao('Faturamento', linha('Razão social', campo('razao_social')) + linha('CNPJ', campo('cnpj')) + linha('Endereço de cobrança', campo('endereco_cobranca')))}

      <tr><td style="padding:28px 32px 30px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${LINHA};">
          <tr><td style="padding:14px 0 0;font-family:${CORPO};font-size:12px;line-height:1.6;color:${CINZA_CLARO};">Aviso automático do Hub Pure Pilates · Pedido #${campo('id')}</td></tr>
        </table>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>`;
}

export const ASSUNTO =
  "=Mídia local TV Globo — {{ $json.body.nome_unidade }} ({{ $json.body.periodo_fmt }})";

/**
 * Executa o modelo como o n8n executa: cada `{{ ... }}` é avaliado com `$json`
 * apontando para o corpo do webhook. É isto que gera a prévia e que os testes
 * usam para conferir o e-mail de verdade, não uma cópia dele.
 */
export function renderizar(modelo, body) {
  const $json = { body };
  return modelo.replace(/\{\{([\s\S]*?)\}\}/g, (_m, expressao) => String(new Function('$json', `return (${expressao});`)($json)));
}

export const EXEMPLO = {
  id: '5b1c9a40-2d7e-4c3a-9a10-6f4e2b8d7c11',
  nome_franqueado: 'Ana Souza',
  email_franqueado: 'ana.souza@exemplo.com',
  telefone_fmt: '(11) 99999-1234',
  nome_unidade: 'Pure Pilates Moema',
  endereco_unidade: 'Av. Ibirapuera, 2000 - Moema, São Paulo/SP',
  cep: '04029-200',
  objetivo_label: 'Inauguração prevista (loja nova)',
  data_inauguracao_fmt: '10/01/2027',
  periodo_fmt: '01/12/2026 a 15/12/2026',
  cnpj: '11.222.333/0001-81',
  razao_social: 'Moema Pilates Ltda',
  endereco_cobranca: 'Rua das Flores, 10 - Centro, São Paulo/SP, CEP 01000-000',
  criativo_label: 'Adaptação de comercial de campanha temática (tem custo de Ancine, calculado à parte)',
  ancine: true,
  criativo_info: 'Usar o comercial da campanha de janeiro.\nTrocar o endereço final para a unidade Moema.',
  produtos_texto: 'TV mais digital · Near Live (comercial gravado com talento local)',
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const modelo = montarModelo();
  process.stdout.write(process.argv.includes('--previa') ? renderizar(modelo, EXEMPLO) : '=' + modelo);
}
