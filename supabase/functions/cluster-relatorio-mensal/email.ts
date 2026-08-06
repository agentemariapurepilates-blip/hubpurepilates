// Montagem do e-mail do relatorio mensal de clusters.
//
// Sem nenhuma API do Deno nem acesso a rede: so funcoes puras, para poder ser
// testado pelo vitest do projeto e gerar previa sem publicar nada.
//
// AS FAIXAS SAO DUPLICADAS DE PROPOSITO. A Edge Function nao consegue importar
// de src/ (contextos de execucao diferentes), entao a regra vive nos dois
// lugares. O que impede a divergencia e um teste em src/ que importa OS DOIS
// modulos e exige que concordem faixa a faixa -- ver relatorio-clusters.test.ts.

export interface FaixaDoEmail {
  numero: 1 | 2 | 3 | 4 | 5;
  rotulo: string;
  minimo: number;
  maximo: number | null;
  cor: string;
}

export const FAIXAS_EMAIL: FaixaDoEmail[] = [
  { numero: 1, rotulo: 'Cluster 1', minimo: 80, maximo: null, cor: '#c5203c' },
  { numero: 2, rotulo: 'Cluster 2', minimo: 60, maximo: 79, cor: '#d9536a' },
  { numero: 3, rotulo: 'Cluster 3', minimo: 40, maximo: 59, cor: '#e88797' },
  { numero: 4, rotulo: 'Cluster 4', minimo: 20, maximo: 39, cor: '#b9bec4' },
  { numero: 5, rotulo: 'Cluster 5', minimo: 0, maximo: 19, cor: '#7d838a' },
];

export function clusterDeValor(valor: number): 1 | 2 | 3 | 4 | 5 {
  if (valor >= 80) return 1;
  if (valor >= 60) return 2;
  if (valor >= 40) return 3;
  if (valor >= 20) return 4;
  return 5;
}

export interface ContagemPorCluster {
  cluster1: number;
  cluster2: number;
  cluster3: number;
  cluster4: number;
  cluster5: number;
  total: number;
}

export function contar(valores: number[]): ContagemPorCluster {
  const c: ContagemPorCluster = {
    cluster1: 0, cluster2: 0, cluster3: 0, cluster4: 0, cluster5: 0, total: valores.length,
  };
  for (const v of valores) c[`cluster${clusterDeValor(v)}` as 'cluster1'] += 1;
  return c;
}

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

/** '2026-07' → 'julho de 2026'. */
export function mesPorExtenso(mes: string): string {
  const [ano, m] = mes.split('-');
  return `${MESES[Number(m) - 1]} de ${ano}`;
}

/** O mês anterior a 'YYYY-MM'. */
export function mesAnterior(mes: string): string {
  let [ano, m] = mes.split('-').map(Number);
  m -= 1;
  if (m < 1) { m = 12; ano -= 1; }
  return `${ano}-${String(m).padStart(2, '0')}`;
}

const ESCAPES: Record<string, string> = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
};

export function esc(texto: string): string {
  return String(texto ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

const pct = (n: number, total: number) => (total === 0 ? 0 : Math.round((n / total) * 1000) / 10);

/** Seta e sinal da variação. Sem cor de juízo — ver o comentário abaixo. */
function variacaoHtml(diferenca: number): string {
  if (diferenca === 0) return '<span style="color:#8a9099;">— sem mudança</span>';
  // NAO usamos verde/vermelho: ganhar unidades no Cluster 5 (as menores) nao e
  // bom, e perder no Cluster 1 nao e neutro. A direcao e fato; o juizo e de
  // quem le.
  const seta = diferenca > 0 ? '▲' : '▼';
  return `<span style="color:#1a1a1a;font-weight:600;">${seta} ${diferenca > 0 ? '+' : ''}${diferenca}</span>`;
}

function linhaHtml(faixa: FaixaDoEmail, atual: number, anterior: number, totalAtual: number): string {
  const faixaTexto = faixa.maximo === null ? `${faixa.minimo}+` : `${faixa.minimo}–${faixa.maximo}`;
  return `
    <tr>
      <td style="padding:13px 0;border-bottom:1px solid #e6e8eb;font-family:'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif;vertical-align:middle;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="width:12px;height:12px;background-color:${faixa.cor};border-radius:3px;font-size:0;line-height:0;">&nbsp;</td>
          <td style="padding-left:9px;font-size:14px;font-weight:600;color:#1a1a1a;white-space:nowrap;">${esc(faixa.rotulo)}</td>
          <td style="padding-left:8px;font-size:12px;color:#8a9099;white-space:nowrap;">${esc(faixaTexto)}</td>
        </tr></table>
      </td>
      <td style="padding:13px 0;border-bottom:1px solid #e6e8eb;font-family:'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:18px;font-weight:700;color:#1a1a1a;text-align:right;">${atual}</td>
      <td style="padding:13px 0 13px 10px;border-bottom:1px solid #e6e8eb;font-family:'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:#8a9099;text-align:right;white-space:nowrap;">${pct(atual, totalAtual).toString().replace('.', ',')}%</td>
      <td style="padding:13px 0 13px 14px;border-bottom:1px solid #e6e8eb;font-family:'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;text-align:right;white-space:nowrap;">${variacaoHtml(atual - anterior)}</td>
    </tr>`;
}

/**
 * Assunto e corpo do relatorio mensal de clusters.
 *
 * Identidade do Hub: Montserrat nos titulos, Inter no corpo, vermelho #c5203c,
 * faixa vermelha no topo. Tabelas e estilo inline porque cliente de e-mail nao
 * suporta flex/grid nem folha externa; sem imagem remota, que Gmail e Outlook
 * bloqueiam por padrao.
 */
export function montarEmailDeClusters(
  mesFechado: string,
  atual: ContagemPorCluster,
  anterior: ContagemPorCluster,
): { assunto: string; corpo: string } {
  const nomeMes = mesPorExtenso(mesFechado);
  const nomeAnterior = mesPorExtenso(mesAnterior(mesFechado));
  const assunto = `Clusters de matriculados — ${nomeMes}`;

  const linhas = FAIXAS_EMAIL.map((f) => {
    const chave = `cluster${f.numero}` as 'cluster1';
    return linhaHtml(f, atual[chave], anterior[chave], atual.total);
  }).join('');

  const diferencaTotal = atual.total - anterior.total;

  const corpo = `<style>@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');</style>
<body style="margin:0;padding:0;background-color:#f4f5f7;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f5f7;">
  <tr><td align="center" style="padding:24px 12px;">
    <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;">

      <tr><td style="height:4px;line-height:4px;font-size:0;background-color:#c5203c;">&nbsp;</td></tr>

      <tr><td style="padding:32px 32px 0;">
        <p style="margin:0 0 12px;font-family:'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:1.4px;text-transform:uppercase;color:#c5203c;">Relatório mensal</p>
        <h1 style="margin:0 0 8px;font-family:'Montserrat','Segoe UI','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:26px;line-height:1.25;font-weight:700;letter-spacing:-0.4px;color:#1a1a1a;">Clusters de matriculados</h1>
        <p style="margin:0;font-family:'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#6b7076;">${esc(nomeMes)}</p>
      </td></tr>

      <tr><td style="padding:26px 32px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fafafa;border:1px solid #e6e8eb;border-radius:10px;">
          <tr><td style="padding:16px 18px;font-family:'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
            <span style="font-size:26px;font-weight:700;color:#1a1a1a;">${atual.total}</span>
            <span style="font-size:14px;color:#6b7076;"> unidades com dado no mês</span>
            <span style="font-size:13px;color:#8a9099;"> &nbsp;·&nbsp; ${variacaoHtml(diferencaTotal)} em relação a ${esc(nomeAnterior)}</span>
          </td></tr>
        </table>
      </td></tr>

      <tr><td style="padding:22px 32px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding-bottom:6px;font-family:'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#8a9099;">Faixa</td>
            <td style="padding-bottom:6px;font-family:'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#8a9099;text-align:right;">Unidades</td>
            <td style="padding-bottom:6px;font-family:'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#8a9099;text-align:right;">%</td>
            <td style="padding-bottom:6px;font-family:'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#8a9099;text-align:right;">vs ${esc(nomeAnterior.split(' de ')[0])}</td>
          </tr>
          ${linhas}
        </table>
      </td></tr>

      <tr><td style="padding:26px 32px 30px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #e6e8eb;">
          <tr><td style="padding:14px 0 0;font-family:'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#8a9099;">A faixa é a quantidade de alunos matriculados da unidade no último dia com dado do mês. Relatório automático do Hub Pure Pilates, enviado todo dia 1 às 3h.</td></tr>
        </table>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>`;

  return { assunto, corpo };
}
