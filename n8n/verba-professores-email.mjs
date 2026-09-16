// Modelo do e-mail dos pedidos de verba para novos professores.
//
// O e-mail é montado no n8n (workflow "Verba para novos professores -
// Notificacao por email", id wtW40NSsKLIkYIt1), igual à Mídia Adicional. Este
// arquivo é a FONTE do HTML que vai no nó Gmail: gera o modelo com expressões
// do n8n e uma prévia com dados de exemplo.
//
//   node n8n/verba-professores-email.mjs            → imprime o modelo do n8n
//   node n8n/verba-professores-email.mjs --previa   → imprime a prévia (HTML)
//
// IDENTIDADE (conferida no código, não de memória): vermelho #c5203c
// (--pure-red), preto #1a1a1a (--pure-black), Montserrat nos títulos e Inter no
// corpo. Regras de e-mail: tabelas e estilo inline (cliente de e-mail não
// aceita flex/grid nem CSS externo), sem imagem remota (Gmail e Outlook
// bloqueiam), webfont como best-effort com alternativas próximas.
//
// Tudo que o franqueado digita passa por escape: sem isso, "<b>" no nome da
// unidade viraria HTML dentro do e-mail.

import { pathToFileURL } from 'node:url';

const VERMELHO = '#c5203c';
const PRETO = '#1a1a1a';
const CINZA = '#6b7076';
const CINZA_CLARO = '#8a9099';
const LINHA = '#e6e8eb';
const FUNDO = '#f4f5f7';
const ROSADO = '#fbeef1';

const CORPO = "'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const TITULO = "'Montserrat','Segoe UI','Helvetica Neue',Helvetica,Arial,sans-serif";

const HUB = 'https://hub.purepilates.com.br';

/** Expressão do n8n que lê um campo do corpo do webhook, com escape de HTML. */
function campo(nome, vazio = '') {
  const escape = ".replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;')";
  return `{{ (String($json.body.${nome} ?? '')${escape}) || '${vazio}' }}`;
}

export function montarModelo(v = campo) {
  const linha = (rotulo, valor) => `
          <tr>
            <td style="padding:12px 0 0;font-family:${CORPO};font-size:12px;color:${CINZA_CLARO};width:160px;vertical-align:top;">${rotulo}</td>
            <td style="padding:12px 0 0;font-family:${CORPO};font-size:14px;font-weight:500;color:${PRETO};">${valor}</td>
          </tr>`;

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
            <td align="right" style="font-family:${CORPO};font-size:11px;letter-spacing:0.6px;color:${CINZA_CLARO};">Hub · Minha Área</td>
          </tr>
        </table>
      </td></tr>

      <tr><td style="padding:28px 32px 0;">
        <p style="margin:0 0 10px;font-family:${CORPO};font-size:11px;font-weight:600;letter-spacing:1.4px;text-transform:uppercase;color:${VERMELHO};">Nova solicitação · Verba para novos professores</p>
        <h1 style="margin:0 0 8px;font-family:${TITULO};font-size:28px;line-height:1.25;font-weight:700;letter-spacing:-0.4px;color:${PRETO};">${v('nome_unidade')}</h1>
        <p style="margin:0;font-family:${CORPO};font-size:15px;line-height:1.55;color:${CINZA};">pediu verba para uma campanha de recrutamento de novos professores.</p>
      </td></tr>

      <tr><td style="padding:24px 32px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${ROSADO};border-radius:10px;">
          <tr>
            <td width="55%" style="padding:18px 20px;border-right:1px solid #f1d3da;">
              <p style="margin:0 0 4px;font-family:${CORPO};font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:${CINZA};">Verba solicitada</p>
              <p style="margin:0;font-family:${TITULO};font-size:26px;font-weight:800;color:${VERMELHO};white-space:nowrap;">${v('valor_verba_fmt')}</p>
            </td>
            <td width="45%" style="padding:18px 20px;">
              <p style="margin:0 0 4px;font-family:${CORPO};font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:${CINZA};">Professores</p>
              <p style="margin:0;font-family:${TITULO};font-size:26px;font-weight:800;color:${PRETO};">${v('qtd_professores')}</p>
            </td>
          </tr>
        </table>
      </td></tr>

      <tr><td style="padding:22px 32px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${LINHA};">
          ${linha('Franqueado', v('nome_franqueado'))}
          ${linha('Inauguração', v('data_inauguracao_fmt'))}
          ${linha('E-mail da unidade', v('email_unidade'))}
          ${linha('E-mail do franqueado', v('email_franqueado', '—'))}
          ${linha('Enviado por', v('submitted_by', '—'))}
        </table>
      </td></tr>

      <tr><td style="padding:26px 32px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="border-radius:8px;background-color:${VERMELHO};">
            <a href="${HUB}/midia-adicional/unidades" style="display:inline-block;padding:12px 22px;font-family:${CORPO};font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">Ver e aprovar no Hub</a>
          </td></tr>
        </table>
        <p style="margin:10px 0 0;font-family:${CORPO};font-size:12px;color:${CINZA_CLARO};">Colaboradores → Visão Geral das Unidades. Responder este e-mail fala direto com a unidade.</p>
      </td></tr>

      <tr><td style="padding:28px 32px 30px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${LINHA};">
          <tr><td style="padding:14px 0 0;font-family:${CORPO};font-size:12px;line-height:1.6;color:${CINZA_CLARO};">Aviso automático do Hub Pure Pilates · Solicitação #${v('id')}</td></tr>
        </table>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>`;
}

export const ASSUNTO =
  '=Verba para novos professores — {{ $json.body.nome_unidade }} ({{ $json.body.valor_verba_fmt }})';

const EXEMPLO = {
  id: '3f6c1a2e-8b4d-4e1a-9c2f-7d5e0b1a4c33',
  nome_unidade: 'Pure Pilates Moema',
  valor_verba_fmt: 'R$ 9.000,00',
  qtd_professores: 3,
  nome_franqueado: 'Ana Souza',
  data_inauguracao_fmt: '05/11/2026',
  email_unidade: 'moema@purepilates.com.br',
  email_franqueado: 'ana.souza@exemplo.com',
  submitted_by: 'ana.souza@exemplo.com',
};

const previa = (nome, vazio = '') => String(EXEMPLO[nome] ?? '') || vazio;

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.stdout.write(process.argv.includes('--previa') ? montarModelo(previa) : '=' + montarModelo());
}
