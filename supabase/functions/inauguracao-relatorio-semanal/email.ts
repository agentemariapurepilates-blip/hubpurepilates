// Montagem do e-mail do relatorio semanal.
//
// Separado do index.ts de proposito: aqui nao ha nenhuma API do Deno nem
// acesso a rede, so funcoes puras. Isso permite testar a parte que mais erra
// em silencio -- as janelas de data e o escape do HTML -- com o vitest do
// projeto, e gerar uma previa do e-mail sem publicar nada.

export interface InauguracaoDoRelatorio {
  nome_unidade: string;
  unidade_id: string;
  endereco: string;
  solicitante_nome: string;
  data_inauguracao: string;
}

/** Soma dias a uma data YYYY-MM-DD sem envolver o fuso da maquina. */
export function somarDias(data: string, dias: number): string {
  // 12:00Z como ancora: com 00:00Z, uma implementacao que passe por horario
  // local em algum ponto poderia cair no dia anterior.
  const d = new Date(`${data}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

export function ddmmaaaa(data: string): string {
  return data.split('-').reverse().join('/');
}

const ESCAPES: Record<string, string> = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
};

/**
 * Escapa o que vem do banco antes de entrar no HTML.
 *
 * O nome e o endereco da unidade sao digitados por um colaborador. Sem isto,
 * um `<` no endereco quebraria o layout -- e, no limite, permitiria injetar
 * marcacao no corpo que o marketing recebe.
 */
export function esc(texto: string): string {
  return String(texto ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

/** As duas janelas de 7 dias, encostadas e sem sobreposicao. */
export function janelas(hoje: string) {
  return {
    inicioPassada: somarDias(hoje, -7),
    fimPassada: somarDias(hoje, -1),
    inicioProxima: hoje,
    fimProxima: somarDias(hoje, 6),
  };
}

function linhaHtml(i: InauguracaoDoRelatorio): string {
  return `
    <tr>
      <td style="padding:12px 16px 12px 0;border-bottom:1px solid #e6e8eb;font-family:'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;font-weight:600;color:#c5203c;white-space:nowrap;vertical-align:top;width:104px;">${esc(ddmmaaaa(i.data_inauguracao))}</td>
      <td style="padding:12px 0;border-bottom:1px solid #e6e8eb;font-family:'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:#1a1a1a;">
        <div style="font-weight:600;">${esc(i.nome_unidade)}</div>
        <div style="font-size:12px;color:#8a9099;padding-top:2px;">ID ${esc(i.unidade_id)} &nbsp;&middot;&nbsp; ${esc(i.endereco)}</div>
        <div style="font-size:12px;color:#8a9099;padding-top:2px;">Solicitado por ${esc(i.solicitante_nome)}</div>
      </td>
    </tr>`;
}

function secaoHtml(titulo: string, periodo: string, linhas: InauguracaoDoRelatorio[], vazio: string): string {
  const corpo = linhas.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${linhas.map(linhaHtml).join('')}</table>`
    : `<p style="margin:8px 0 0;font-family:'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:#8a9099;">${esc(vazio)}</p>`;

  return `
    <tr><td style="padding:28px 32px 0;">
      <p style="margin:0 0 2px;font-family:'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:1.4px;text-transform:uppercase;color:#c5203c;">${esc(titulo)}</p>
      <p style="margin:0 0 10px;font-family:'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:#8a9099;">${esc(periodo)}</p>
      ${corpo}
    </td></tr>`;
}

/**
 * Assunto e corpo do relatorio.
 *
 * O assunto conta as inauguracoes da PROXIMA semana, e nao o total: quem le a
 * caixa de entrada precisa saber o que vem, nao o que ja passou.
 *
 * Identidade do Hub: Montserrat nos titulos, Inter no corpo, vermelho #c5203c.
 * Tabelas e estilo inline porque cliente de e-mail nao suporta flex/grid nem
 * folha externa; o @import da fonte e best-effort (Gmail e Outlook ignoram e
 * caem na alternativa, nunca quebram).
 */
export function montarEmail(
  passadas: InauguracaoDoRelatorio[],
  proximas: InauguracaoDoRelatorio[],
  hoje: string,
): { assunto: string; corpo: string } {
  const { inicioPassada, fimPassada, fimProxima } = janelas(hoje);

  const assunto = proximas.length === 0
    ? 'Relatório semanal de inaugurações — nenhuma nesta semana'
    : `Relatório semanal de inaugurações — ${proximas.length} nesta semana`;

  const corpo = `<style>@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700&family=Inter:wght@400;500;600&display=swap');</style>
<body style="margin:0;padding:0;background-color:#f4f5f7;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f5f7;">
  <tr><td align="center" style="padding:24px 12px;">
    <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;">

      <tr><td style="height:4px;line-height:4px;font-size:0;background-color:#c5203c;">&nbsp;</td></tr>

      <tr><td style="padding:32px 32px 0;">
        <p style="margin:0 0 12px;font-family:'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:1.4px;text-transform:uppercase;color:#c5203c;">Relatório semanal</p>
        <h1 style="margin:0 0 8px;font-family:'Montserrat','Segoe UI','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:26px;line-height:1.25;font-weight:700;letter-spacing:-0.4px;color:#1a1a1a;">Inaugurações</h1>
        <p style="margin:0;font-family:'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#6b7076;">Segunda-feira, ${esc(ddmmaaaa(hoje))}</p>
      </td></tr>

      ${secaoHtml('Semana que passou', `${ddmmaaaa(inicioPassada)} a ${ddmmaaaa(fimPassada)}`, passadas, 'Nenhuma unidade inaugurou.')}
      ${secaoHtml('Próxima semana', `${ddmmaaaa(hoje)} a ${ddmmaaaa(fimProxima)}`, proximas, 'Nenhuma inauguração marcada.')}

      <tr><td style="padding:26px 32px 30px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #e6e8eb;">
          <tr><td style="padding:14px 0 0;font-family:'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#8a9099;">Relatório automático do Hub Pure Pilates, enviado toda segunda-feira às 7h. Os dados vêm de Inaugurações, preenchidos pelos colaboradores.</td></tr>
        </table>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>`;

  return { assunto, corpo };
}
