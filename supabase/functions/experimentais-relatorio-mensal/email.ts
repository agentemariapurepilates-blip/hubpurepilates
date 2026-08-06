// Relatorio de aulas experimentais: as unidades divididas em BOM, REGULAR e
// RUIM pela media dos 3 ultimos meses.
//
// Funcoes puras, sem API do Deno: testavel pelo vitest do projeto e permite
// gerar previa sem publicar nada.
//
// FAIXAS FIXAS, definidas pelo usuario (04/08/2026):
//   Ruim     0 a 19
//   Regular  20 a 29
//   Bom      30 ou mais
//
// Sao ABSOLUTAS, e nao relativas a rede: uma unidade so muda de bloco se o
// numero dela mudar. A versao anterior usava tercis, em que um terco caia em
// "ruim" mesmo num mes em que todas melhorassem -- o usuario preferiu o
// criterio fixo, que responde "esta boa?" em vez de "esta melhor que as
// outras?".
//
// Efeito nos dados atuais (media de jun-ago/2026, 475 unidades): a maior parte
// da rede fica em Ruim, porque a mediana da media e ~11,7. Isso e informacao,
// nao defeito da faixa.

export interface LinhaDoRelatorio {
  unitId: number;
  nome: string;
  media: number;
  mesesComDado: number;
}

export type Bloco = 'bom' | 'regular' | 'ruim';

export interface DefinicaoDeBloco {
  chave: Bloco;
  rotulo: string;
  /** Limite inferior, inclusivo. */
  minimo: number;
  /** Limite superior, inclusivo. `null` = sem teto. */
  maximo: number | null;
  cor: string;
}

// Vermelho da marca no topo, cinza descendo -- mesma escala visual dos outros
// relatorios, onde o vermelho marca o melhor. Sem verde/vermelho de semaforo: a
// cor indica posicao, o juizo esta no rotulo.
//
// A ordem aqui e a de LEITURA do e-mail (melhor primeiro), e nao a da tela de
// configuracao, que lista por valor crescente.
export const BLOCOS: DefinicaoDeBloco[] = [
  { chave: 'bom', rotulo: 'Bom', minimo: 30, maximo: null, cor: '#c5203c' },
  { chave: 'regular', rotulo: 'Regular', minimo: 20, maximo: 29, cor: '#b9bec4' },
  { chave: 'ruim', rotulo: 'Ruim', minimo: 0, maximo: 19, cor: '#7d838a' },
];

/** Em que bloco a media cai. */
export function blocoDaMedia(media: number): Bloco {
  if (media >= 30) return 'bom';
  if (media >= 20) return 'regular';
  return 'ruim';
}

/** Texto da faixa para o cabecalho: "30 ou mais", "20 a 29". */
export function faixaDoBloco(b: DefinicaoDeBloco): string {
  return b.maximo === null ? `${b.minimo} ou mais` : `${b.minimo} a ${b.maximo}`;
}

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

export function mesPorExtenso(mes: string): string {
  const [ano, m] = mes.split('-');
  return `${MESES[Number(m) - 1]} de ${ano}`;
}

export function mesCurto(mes: string): string {
  const [ano, m] = mes.split('-');
  return `${MESES[Number(m) - 1].slice(0, 3)}/${ano.slice(2)}`;
}

const ESCAPES: Record<string, string> = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
};

export function esc(texto: string): string {
  return String(texto ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

const numero = (n: number) => String(n).replace('.', ',');

function linhaHtml(l: LinhaDoRelatorio, cor: string): string {
  // Menos de 3 meses muda a leitura da media: a unidade pode ter aberto no meio
  // do periodo. Marcado com asterisco, explicado no rodape.
  const marca = l.mesesComDado < 3 ? '<span style="color:#c5203c;">*</span>' : '';

  return `
    <tr>
      <td style="padding:10px 8px 10px 0;border-bottom:1px solid #eef0f2;font-family:'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:#8a9099;white-space:nowrap;vertical-align:middle;width:44px;">${l.unitId}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #eef0f2;font-family:'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;color:#1a1a1a;vertical-align:middle;">${esc(l.nome)}${marca}</td>
      <td style="padding:10px 0 10px 8px;border-bottom:1px solid #eef0f2;font-family:'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;color:${cor};text-align:right;vertical-align:middle;white-space:nowrap;">${numero(l.media)}</td>
    </tr>`;
}

function blocoHtml(def: DefinicaoDeBloco, linhas: LinhaDoRelatorio[], faixa: string): string {
  const corpo = linhas.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${linhas.map((l) => linhaHtml(l, def.cor)).join('')}</table>`
    : `<p style="margin:6px 0 0;font-family:'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:#8a9099;">Nenhuma unidade neste bloco.</p>`;

  return `
    <tr><td style="padding:30px 32px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:3px solid ${def.cor};">
        <tr><td style="padding:12px 0 4px;font-family:'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
          <span style="font-family:'Montserrat','Segoe UI',Helvetica,Arial,sans-serif;font-size:19px;font-weight:700;color:#1a1a1a;">${esc(def.rotulo)}</span>
          <span style="font-size:13px;color:#8a9099;"> &nbsp;·&nbsp; ${linhas.length} unidades &nbsp;·&nbsp; ${esc(faixa)}</span>
        </td></tr>
      </table>
      ${corpo}
    </td></tr>`;
}

/**
 * Assunto e corpo do relatorio.
 *
 * Identidade do Hub: Montserrat nos titulos, Inter no corpo, vermelho #c5203c,
 * faixa vermelha no topo. Tabelas e estilo inline porque cliente de e-mail nao
 * suporta flex/grid nem folha externa; sem imagem remota, que Gmail e Outlook
 * bloqueiam por padrao.
 */
export function montarEmailExperimentais(
  meses: string[],
  linhas: LinhaDoRelatorio[],
): { assunto: string; corpo: string } {
  const periodo = `${mesCurto(meses[0])} a ${mesCurto(meses[meses.length - 1])}`;
  const assunto = `Aulas experimentais — média de ${periodo}`;

  const ordenadas = [...linhas].sort((a, b) => b.media - a.media || a.nome.localeCompare(b.nome, 'pt-BR'));

  const porBloco: Record<Bloco, LinhaDoRelatorio[]> = { bom: [], regular: [], ruim: [] };
  for (const l of ordenadas) porBloco[blocoDaMedia(l.media)].push(l);

  const temParciais = linhas.some((l) => l.mesesComDado < 3);

  const resumo = BLOCOS.map((b) => `
    <td style="padding:0 8px 0 0;font-family:'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif;width:33%;">
      <div style="border-top:3px solid ${b.cor};padding-top:9px;">
        <div style="font-size:22px;font-weight:700;color:#1a1a1a;line-height:1.1;">${porBloco[b.chave].length}</div>
        <div style="font-size:12px;font-weight:600;color:#1a1a1a;padding-top:3px;">${esc(b.rotulo)}</div>
        <div style="font-size:11px;color:#8a9099;padding-top:1px;">${esc(faixaDoBloco(b))}</div>
      </div>
    </td>`).join('');

  const corpo = `<style>@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');</style>
<body style="margin:0;padding:0;background-color:#f4f5f7;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f5f7;">
  <tr><td align="center" style="padding:24px 12px;">
    <table role="presentation" width="680" cellpadding="0" cellspacing="0" border="0" style="max-width:680px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;">

      <tr><td style="height:4px;line-height:4px;font-size:0;background-color:#c5203c;">&nbsp;</td></tr>

      <tr><td style="padding:32px 32px 0;">
        <p style="margin:0 0 12px;font-family:'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:1.4px;text-transform:uppercase;color:#c5203c;">Aulas experimentais</p>
        <h1 style="margin:0 0 8px;font-family:'Montserrat','Segoe UI','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:26px;line-height:1.25;font-weight:700;letter-spacing:-0.4px;color:#1a1a1a;">Média dos 3 últimos meses</h1>
        <p style="margin:0;font-family:'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#6b7076;">${esc(mesPorExtenso(meses[0]))} a ${esc(mesPorExtenso(meses[meses.length - 1]))} &nbsp;·&nbsp; ${linhas.length} unidades</p>
      </td></tr>

      <tr><td style="padding:24px 32px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${resumo}</tr></table>
      </td></tr>

      ${BLOCOS.map((b) => blocoHtml(b, porBloco[b.chave], faixaDoBloco(b))).join('')}

      <tr><td style="padding:28px 32px 30px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #e6e8eb;">
          <tr><td style="padding:14px 0 0;font-family:'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#8a9099;">
            A média é das aulas experimentais de cada unidade nos 3 meses do período. Os blocos são fixos — Bom a partir de 30, Regular de 20 a 29, Ruim até 19 — e não dependem de como as outras unidades foram: se a rede inteira melhorar, todas podem chegar a "Bom".${temParciais ? ' <span style="color:#c5203c;">*</span> A unidade tem dado em menos de 3 meses, e a média é só dos meses existentes.' : ''}
            <br>Relatório automático do Hub Pure Pilates, enviado no penúltimo dia de cada mês às 3h.
          </td></tr>
        </table>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>`;

  return { assunto, corpo };
}
