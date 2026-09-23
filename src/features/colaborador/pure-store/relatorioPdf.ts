// Relatório de pedidos da Pure Store: a lista de um período, em PDF.
//
// Quem chama passa os pedidos já filtrados pela tela — assim o papel mostra
// exatamente o que a pessoa está vendo no Gerenciador.

import { jsPDF } from 'jspdf';
import {
  CINZA,
  ESCURO,
  LINHA,
  MARGEM,
  RODAPE_Y,
  VERMELHO,
  cabecalhoDaMarca,
  dataCurta,
  diaBR,
  dinheiro,
  rodape,
} from './pdfPureStore';

const LARGURA = 210;

// Colunas, em mm. A de situação precisa caber "Finalizado" sem cortar, e a de
// total precisa de folga para valores na casa dos milhares.
const COL = {
  numero: MARGEM,
  data: MARGEM + 10,
  cliente: MARGEM + 32,
  unidade: MARGEM + 78,
  itens: MARGEM + 112,
  status: MARGEM + 124,
  total: LARGURA - MARGEM,
};
/** Onde o maior valor da coluna Total começa; a situação não pode passar daqui. */
const LIMITE_STATUS = COL.total - 24;

export interface PedidoDoRelatorio {
  numero: number;
  data_pedido: string;
  cliente_nome: string;
  cliente_unidade: string;
  /** Rótulo já traduzido ("Pedido separado", "Cancelado"...). */
  status: string;
  quantidadeDeItens: number;
  total: number;
}

export interface PeriodoDoRelatorio {
  de?: string;
  ate?: string;
  /** Texto da busca por cliente, quando houver. */
  busca?: string;
}

export interface ResumoDoRelatorio {
  quantidade: number;
  total: number;
  ticketMedio: number;
  porStatus: { status: string; quantidade: number; total: number }[];
}

/** Totais do período e a quebra por coluna do quadro. */
export function resumirPedidos(pedidos: PedidoDoRelatorio[]): ResumoDoRelatorio {
  const total = Math.round(pedidos.reduce((soma, p) => soma + p.total, 0) * 100) / 100;
  const porStatus = new Map<string, { status: string; quantidade: number; total: number }>();
  for (const pedido of pedidos) {
    const atual = porStatus.get(pedido.status) ?? { status: pedido.status, quantidade: 0, total: 0 };
    atual.quantidade += 1;
    atual.total = Math.round((atual.total + pedido.total) * 100) / 100;
    porStatus.set(pedido.status, atual);
  }
  return {
    quantidade: pedidos.length,
    total,
    ticketMedio: pedidos.length ? Math.round((total / pedidos.length) * 100) / 100 : 0,
    porStatus: [...porStatus.values()].sort((a, b) => b.total - a.total),
  };
}

/** "01/09/2026 a 30/09/2026", "até 30/09", "a partir de 01/09" ou "todos os pedidos". */
export function descreverPeriodo(periodo: PeriodoDoRelatorio) {
  const { de, ate } = periodo;
  if (de && ate) return `${diaBR(de)} a ${diaBR(ate)}`;
  if (de) return `a partir de ${diaBR(de)}`;
  if (ate) return `até ${diaBR(ate)}`;
  return 'todos os pedidos';
}

function cabecalhoDaTabela(doc: jsPDF, y: number) {
  doc.setFillColor(...ESCURO);
  doc.rect(MARGEM, y, LARGURA - MARGEM * 2, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('Nº', COL.numero + 2, y + 5.4);
  doc.text('DATA', COL.data, y + 5.4);
  doc.text('CLIENTE', COL.cliente, y + 5.4);
  doc.text('UNIDADE', COL.unidade, y + 5.4);
  doc.text('ITENS', COL.itens, y + 5.4);
  doc.text('SITUAÇÃO', COL.status, y + 5.4);
  doc.text('TOTAL', COL.total - 2, y + 5.4, { align: 'right' });
  return y + 12.5;
}

const cortar = (doc: jsPDF, texto: string, largura: number) => {
  const linhas = doc.splitTextToSize(texto || '—', largura) as string[];
  return linhas[0] + (linhas.length > 1 ? '…' : '');
};

export async function montarRelatorioPdf(dados: {
  pedidos: PedidoDoRelatorio[];
  periodo: PeriodoDoRelatorio;
  criadoEm?: Date;
}) {
  const criadoEm = dados.criadoEm ?? new Date();
  const resumo = resumirPedidos(dados.pedidos);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  let y = await cabecalhoDaMarca(doc, {
    titulo: 'RELATÓRIO DE PEDIDOS',
    subtitulo: descreverPeriodo(dados.periodo),
  });

  // — Resumo do período ——————————————————————————————————————
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...ESCURO);
  doc.text(
    `${resumo.quantidade} ${resumo.quantidade === 1 ? 'pedido' : 'pedidos'}  ·  ${dinheiro(resumo.total)}`,
    MARGEM,
    y,
  );
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...CINZA);
  doc.text(`Ticket médio: ${dinheiro(resumo.ticketMedio)}`, MARGEM, y);
  if (dados.periodo.busca) {
    y += 5;
    doc.text(`Filtro de busca: "${dados.periodo.busca}"`, MARGEM, y);
  }

  // — Lista ————————————————————————————————————————————————
  y = cabecalhoDaTabela(doc, y + 7);
  doc.setFontSize(9);

  for (const pedido of dados.pedidos) {
    if (y > RODAPE_Y - 30) {
      doc.addPage();
      y = cabecalhoDaTabela(doc, 20);
      doc.setFontSize(9);
    }

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...ESCURO);
    doc.text(String(pedido.numero), COL.numero + 2, y);
    doc.setTextColor(...CINZA);
    doc.text(diaBR(pedido.data_pedido), COL.data, y);
    doc.setTextColor(...ESCURO);
    doc.text(cortar(doc, pedido.cliente_nome, COL.unidade - COL.cliente - 4), COL.cliente, y);
    doc.setTextColor(...CINZA);
    doc.text(cortar(doc, pedido.cliente_unidade, COL.itens - COL.unidade - 4), COL.unidade, y);
    doc.text(String(pedido.quantidadeDeItens), COL.itens + 2, y);
    doc.text(cortar(doc, pedido.status, LIMITE_STATUS - COL.status), COL.status, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...ESCURO);
    doc.text(dinheiro(pedido.total), COL.total - 2, y, { align: 'right' });

    y += 7;
    doc.setDrawColor(...LINHA);
    doc.setLineWidth(0.2);
    doc.line(MARGEM, y - 3.4, LARGURA - MARGEM, y - 3.4);
  }

  if (dados.pedidos.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...CINZA);
    doc.text('Nenhum pedido no período.', MARGEM, y + 2);
    y += 8;
  }

  // — Total e quebra por situação —————————————————————————————
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...VERMELHO);
  // O rótulo nasce a partir da largura do valor, com 6 mm de folga: em ponto
  // fixo, um total de quatro dígitos encostava no texto.
  const valorTotal = dinheiro(resumo.total);
  doc.text('TOTAL DO PERÍODO', LARGURA - MARGEM - doc.getTextWidth(valorTotal) - 6, y, { align: 'right' });
  doc.text(valorTotal, LARGURA - MARGEM, y, { align: 'right' });

  if (resumo.porStatus.length > 1) {
    y += 10;
    if (y > RODAPE_Y - 30) {
      doc.addPage();
      y = 24;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...ESCURO);
    doc.text('POR SITUAÇÃO', MARGEM, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...CINZA);
    for (const linha of resumo.porStatus) {
      doc.text(`${linha.status}: ${linha.quantidade}`, MARGEM, y);
      doc.setTextColor(...ESCURO);
      doc.text(dinheiro(linha.total), MARGEM + 70, y, { align: 'right' });
      doc.setTextColor(...CINZA);
      y += 5;
    }
  }

  rodape(doc, criadoEm);
  return doc;
}

export async function baixarRelatorioPdf(dados: {
  pedidos: PedidoDoRelatorio[];
  periodo: PeriodoDoRelatorio;
  criadoEm?: Date;
}) {
  const doc = await montarRelatorioPdf(dados);
  const { de, ate } = dados.periodo;
  const trecho = de || ate ? `-${(de ?? 'inicio').slice(0, 10)}-a-${(ate ?? dataCurta(new Date())).slice(0, 10)}` : '';
  doc.save(`relatorio-pedidos${trecho}.pdf`);
}
