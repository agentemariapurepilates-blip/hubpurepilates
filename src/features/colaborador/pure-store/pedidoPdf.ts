// PDF de um pedido da Pure Store — o arquivo que vai para o cliente.
// As peças da marca (logo, cabeçalho, rodapé) vêm de pdfPureStore.ts.

import { jsPDF } from 'jspdf';
import { formatarReal, totalDoItem, type ItemPedido, type ResumoPedido } from './pedidoPureStore';
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
  nomeLimpo,
  rodape,
} from './pdfPureStore';

const LARGURA = 210;

/** Colunas da tabela, em mm: produto, tamanho, qtd, valor unitário, total. */
const COL = {
  produto: MARGEM,
  tamanho: MARGEM + 84,
  quantidade: MARGEM + 112,
  unitario: MARGEM + 128,
  total: LARGURA - MARGEM,
};

export interface ClienteDoPedido {
  nome: string;
  unidade: string;
  telefone: string;
}

export interface PedidoParaPdf {
  /** Número do pedido salvo; sem ele o PDF sai só como "PEDIDO". */
  numero?: number | null;
  /** Data do pedido (yyyy-mm-dd). É ela que sai no cabeçalho, não a de hoje. */
  dataDoPedido?: string;
  cliente: ClienteDoPedido;
  itens: ItemPedido[];
  resumo: ResumoPedido;
  criadoEm?: Date;
}

const nomeDoArquivo = (pedido: PedidoParaPdf) => {
  const quem = nomeLimpo(pedido.cliente.nome);
  const identificacao = pedido.numero ? `pedido-${pedido.numero}` : 'pedido';
  return `${identificacao}${quem ? `-${quem}` : ''}.pdf`;
};

/** Cabeçalho da tabela; devolve o y onde a primeira linha começa. */
function cabecalhoDaTabela(doc: jsPDF, y: number) {
  doc.setFillColor(...ESCURO);
  doc.rect(MARGEM, y, LARGURA - MARGEM * 2, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('PRODUTO', COL.produto + 3, y + 5.4);
  doc.text('TAM.', COL.tamanho, y + 5.4);
  doc.text('QTD', COL.quantidade, y + 5.4);
  doc.text('VALOR UNIT.', COL.unitario, y + 5.4);
  doc.text('TOTAL', COL.total - 3, y + 5.4, { align: 'right' });
  return y + 13;
}

/** Monta o documento. Separado do download para dar para testar sem baixar arquivo. */
export async function montarPedidoPdf(pedido: PedidoParaPdf) {
  const criadoEm = pedido.criadoEm ?? new Date();
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  let y = await cabecalhoDaMarca(doc, {
    titulo: pedido.numero ? `PEDIDO ${pedido.numero}` : 'PEDIDO',
    subtitulo: pedido.dataDoPedido ? diaBR(pedido.dataDoPedido) : dataCurta(criadoEm),
  });

  // — Dados do cliente ——————————————————————————————————————
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...ESCURO);
  doc.text(pedido.cliente.nome || 'Cliente', MARGEM, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...CINZA);
  for (const linha of [pedido.cliente.unidade, pedido.cliente.telefone].filter(Boolean)) {
    doc.text(linha, MARGEM, y);
    y += 5;
  }

  // — Itens ——————————————————————————————————————————————
  y = cabecalhoDaTabela(doc, y + 6);

  doc.setFontSize(9.5);
  for (const item of pedido.itens) {
    const nome = doc.splitTextToSize(item.produto, COL.tamanho - COL.produto - 8) as string[];
    const alturaLinha = Math.max(7, nome.length * 4.6 + 2.4);

    // Quebra de página: repete o cabeçalho da tabela na página nova.
    if (y + alturaLinha > RODAPE_Y - 40) {
      doc.addPage();
      y = cabecalhoDaTabela(doc, 20);
      doc.setFontSize(9.5);
    }

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...ESCURO);
    doc.text(nome, COL.produto + 3, y);
    doc.setTextColor(...CINZA);
    doc.text(item.tamanho || '—', COL.tamanho, y);
    doc.text(String(item.quantidade), COL.quantidade, y);
    doc.text(formatarReal(item.valorUnitario), COL.unitario, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...ESCURO);
    doc.text(formatarReal(totalDoItem(item)), COL.total - 3, y, { align: 'right' });

    y += alturaLinha;
    doc.setDrawColor(...LINHA);
    doc.setLineWidth(0.2);
    doc.line(MARGEM, y - 3.4, LARGURA - MARGEM, y - 3.4);
  }

  // — Resumo ——————————————————————————————————————————————
  const { subtotal, percentual, desconto, frete, total } = pedido.resumo;
  const rotuloX = LARGURA - MARGEM - 52;
  y += 6;

  const linhaResumo = (rotulo: string, valor: string, destaque = false) => {
    doc.setFont('helvetica', destaque ? 'bold' : 'normal');
    doc.setFontSize(destaque ? 12 : 10);
    doc.setTextColor(...(destaque ? VERMELHO : CINZA));
    doc.text(rotulo, rotuloX, y);
    doc.setTextColor(...(destaque ? VERMELHO : ESCURO));
    doc.text(valor, LARGURA - MARGEM, y, { align: 'right' });
    y += destaque ? 0 : 6;
  };

  linhaResumo('Subtotal', formatarReal(subtotal));
  if (desconto > 0) linhaResumo(`Desconto (${percentual}%)`, `- ${formatarReal(desconto)}`);
  if (frete > 0) linhaResumo('Frete', formatarReal(frete));

  y += 2;
  doc.setDrawColor(...ESCURO);
  doc.setLineWidth(0.4);
  doc.line(rotuloX, y - 4, LARGURA - MARGEM, y - 4);
  y += 4;
  linhaResumo('TOTAL', formatarReal(total), true);

  rodape(doc, criadoEm);
  return doc;
}

export async function baixarPedidoPdf(pedido: PedidoParaPdf) {
  const doc = await montarPedidoPdf(pedido);
  doc.save(nomeDoArquivo(pedido));
}
