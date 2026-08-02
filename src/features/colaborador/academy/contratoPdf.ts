import { jsPDF } from 'jspdf';
import type { ContratoRow, Periodo } from './contrato';

// Contratos em PDF de TEXTO (selecionável, multipágina) via jsPDF — leve e
// rápido, usando as fontes nativas do PDF (Helvetica), sem embutir fontes.
// Usamos o texto nativo do jsPDF (splitTextToSize + text) pra que os espaços
// sejam reais — corretos tanto na renderização quanto na cópia/seleção.

const FONT = 'helvetica';
const MARGIN = 56; // pt (~2 cm)

interface Cursor { y: number }

const pageW = (doc: jsPDF) => doc.internal.pageSize.getWidth();
const pageBottom = (doc: jsPDF) => doc.internal.pageSize.getHeight() - MARGIN;

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];
function dataExtenso(ddmmaaaa: string): string {
  const m = ddmmaaaa.match(/^(\d{1,2})\D(\d{1,2})\D(\d{4})/);
  if (!m) return ddmmaaaa;
  const [, d, mo, y] = m;
  return `${d.padStart(2, '0')} de ${MESES[Number(mo) - 1] ?? ''} de ${y}`;
}
function periodoLinha(p: Periodo): string {
  const horas = [p.inicio, p.fim].filter(Boolean).join(' às ');
  const base = [p.data, horas].filter(Boolean).join(' – ');
  return p.tipo ? `${base} (${p.tipo})` : base;
}

// Desenha uma linha (já quebrada) e avança o cursor, paginando se preciso.
function drawLine(doc: jsPDF, cur: Cursor, str: string, x: number, size: number): void {
  const lineH = size * 1.34;
  if (cur.y > pageBottom(doc)) { doc.addPage(); cur.y = MARGIN + size; }
  doc.text(str, x, cur.y);
  cur.y += lineH;
}

// Parágrafo simples (uma fonte). splitTextToSize garante espaços reais.
function para(
  doc: jsPDF,
  cur: Cursor,
  text: string,
  opts: { bold?: boolean; size?: number; gapAfter?: number; indent?: number } = {},
): void {
  const size = opts.size ?? 10.5;
  const left = MARGIN + (opts.indent ?? 0);
  const width = pageW(doc) - MARGIN - left;
  doc.setFont(FONT, opts.bold ? 'bold' : 'normal');
  doc.setFontSize(size);
  for (const ln of doc.splitTextToSize(text, width)) drawLine(doc, cur, ln, left, size);
  cur.y += opts.gapAfter ?? 5;
}

// Parágrafo com rótulo em negrito no início (ex.: "CONTRATANTE: ...").
function paraLabel(
  doc: jsPDF,
  cur: Cursor,
  label: string,
  text: string,
  opts: { size?: number; gapAfter?: number } = {},
): void {
  const size = opts.size ?? 10.5;
  const lineH = size * 1.34;
  const left = MARGIN;
  const width = pageW(doc) - MARGIN * 2;
  doc.setFontSize(size);
  doc.setFont(FONT, 'bold');
  const labelW = doc.getTextWidth(label);
  doc.setFont(FONT, 'normal');
  const spaceW = doc.getTextWidth(' ');

  const gap = spaceW * 2; // gap posicional entre rótulo e valor (fragmentos separados grudam com 1 espaço)

  // Rótulo muito longo (ex.: nome grande) → fica na própria linha e o valor vem
  // abaixo, em largura cheia — evita o valor colar/estourar a margem.
  if (width - labelW - gap < 140) {
    if (cur.y > pageBottom(doc)) { doc.addPage(); cur.y = MARGIN + size; }
    doc.setFont(FONT, 'bold');
    doc.text(label, left, cur.y);
    cur.y += lineH;
    para(doc, cur, text, { size, gapAfter: opts.gapAfter });
    return;
  }

  // Quebra o texto: 1ª linha começa depois do rótulo (+espaço); demais, largura cheia.
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const avail = lines.length === 0 ? width - labelW - gap : width;
    const test = line ? `${line} ${w}` : w;
    if (line && doc.getTextWidth(test) > avail) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);

  if (cur.y > pageBottom(doc)) { doc.addPage(); cur.y = MARGIN + size; }
  doc.setFont(FONT, 'bold');
  doc.text(label, left, cur.y);
  doc.setFont(FONT, 'normal');
  if (lines[0]) doc.text(lines[0], left + labelW + gap, cur.y);
  cur.y += lineH;
  for (let i = 1; i < lines.length; i++) {
    if (cur.y > pageBottom(doc)) { doc.addPage(); cur.y = MARGIN + size; }
    doc.text(lines[i], left, cur.y);
    cur.y += lineH;
  }
  cur.y += opts.gapAfter ?? 5;
}

function titulo(doc: jsPDF, cur: Cursor, linhas: string[]): void {
  doc.setFont(FONT, 'bold');
  doc.setFontSize(13);
  const cx = pageW(doc) / 2;
  cur.y += 12;
  for (const l of linhas) { doc.text(l, cx, cur.y, { align: 'center' }); cur.y += 17; }
  cur.y += 8;
}

function clausula(doc: jsPDF, cur: Cursor, t: string): void {
  cur.y += 6;
  para(doc, cur, t, { bold: true, size: 11, gapAfter: 3 });
}

function itens(doc: jsPDF, cur: Cursor, lista: string[]): void {
  for (const it of lista) para(doc, cur, `•  ${it}`, { indent: 14, gapAfter: 2 });
}

function assinatura(doc: jsPDF, cur: Cursor, l1: string, l2: string): void {
  cur.y += 32;
  if (cur.y > pageBottom(doc)) { doc.addPage(); cur.y = MARGIN + 32; }
  doc.setLineWidth(0.5);
  doc.line(MARGIN, cur.y, MARGIN + 280, cur.y);
  cur.y += 13;
  doc.setFont(FONT, 'bold'); doc.setFontSize(9.5);
  doc.text(l1, MARGIN, cur.y); cur.y += 12;
  doc.setFont(FONT, 'normal');
  doc.text(l2, MARGIN, cur.y);
  cur.y += 4;
}

/** Contrato de Gravação (jsPDF) para uma linha da planilha. */
export function buildContratoGravacaoDoc(row: ContratoRow): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const cur: Cursor = { y: MARGIN };

  titulo(doc, cur, ['CONTRATO DE PRESTAÇÃO DE SERVIÇOS', 'GRAVAÇÃO DE CONTEÚDO, REELS E OUTROS']);

  paraLabel(doc, cur, 'CONTRATANTE:', 'PURE PILATES ACADEMY SERVIÇOS LTDA, inscrita no CNPJ/ME sob o nº 47.891.878/0001-28, com sede social na Rua Herval, nº 816 e 824, Bairro do Belenzinho, na cidade de São Paulo – SP e CEP 03092-000, neste ato representada na forma de seus atos constitutivos.');
  paraLabel(doc, cur, `CONTRATADO: ${row.nome},`, `${row.nacionalidade}, ${row.estadoCivil}, ${row.profissao}, portador da cédula de identidade RG sob nº ${row.rg}${row.orgaoEmissor ? ` (${row.orgaoEmissor})` : ''}, inscrito no CPF sob nº ${row.cpf}, residente e domiciliado na ${row.endereco}, ${row.cidade} – ${row.uf} – CEP ${row.cep}.`);
  para(doc, cur, 'As partes resolvem celebrar o presente contrato, que se regerá pelas cláusulas abaixo:');

  clausula(doc, cur, '1. OBJETO');
  para(doc, cur, 'Prestação de serviços profissionais pelo CONTRATADO para participação em cursos, gravações e produção de conteúdos da CONTRATANTE, incluindo:');
  itens(doc, cur, ['Participação em gravações e conteúdos;', 'Produção de materiais auxiliares;', 'Cessão de direitos autorais;', 'Autorização de uso de nome, imagem e voz.']);

  clausula(doc, cur, '2. EXECUÇÃO DOS SERVIÇOS');
  para(doc, cur, 'Os serviços serão prestados de forma pessoal, nos dias e horários definidos pela CONTRATANTE.');
  para(doc, cur, 'O CONTRATADO compromete-se a:');
  itens(doc, cur, ['Cumprir prazos estabelecidos;', 'Seguir orientações técnicas da CONTRATANTE;', 'Participar das gravações e reuniões necessárias.']);

  clausula(doc, cur, '3. CONTEÚDO E ENTREGAS');
  para(doc, cur, 'O CONTRATADO deverá entregar:');
  itens(doc, cur, ['Atividades avaliativas;', 'Avaliação final;', 'Materiais complementares.']);
  para(doc, cur, 'O não cumprimento poderá gerar multa de R$ 500,00 por item não entregue, podendo ser descontada dos valores devidos.');

  clausula(doc, cur, '4. DIREITOS AUTORAIS');
  para(doc, cur, 'O CONTRATADO cede à CONTRATANTE, de forma gratuita, total, definitiva e irrevogável, todos os direitos patrimoniais sobre os conteúdos produzidos.');
  para(doc, cur, 'A CONTRATANTE poderá utilizar, reproduzir, editar, distribuir e comercializar os conteúdos, no Brasil e no exterior, por qualquer meio.');

  clausula(doc, cur, '5. USO DE IMAGEM, NOME E VOZ');
  para(doc, cur, 'O CONTRATADO autoriza o uso de sua imagem, nome e voz, de forma irrevogável, para fins comerciais e institucionais.');
  para(doc, cur, 'A autorização é válida por todo o prazo legal de proteção dos direitos autorais.');

  clausula(doc, cur, '6. REMUNERAÇÃO');
  para(doc, cur, 'O pagamento será realizado conforme definido no ANEXO deste contrato.');
  para(doc, cur, 'Não haverá pagamento adicional pela cessão de direitos autorais.');
  para(doc, cur, 'Cada parte é responsável pelos seus encargos fiscais e tributários.');

  clausula(doc, cur, '7. EXCLUSIVIDADE');
  para(doc, cur, 'O CONTRATADO não poderá participar de conteúdos concorrentes pagos por 1 (um) ano, salvo exceções previstas em anexo.');

  clausula(doc, cur, '8. PRAZO E RESCISÃO');
  para(doc, cur, 'O contrato poderá ser rescindido em caso de descumprimento, mediante notificação com prazo de 15 dias para correção.');
  para(doc, cur, 'Multa por descumprimento: equivalente ao dobro do valor do contrato.');
  para(doc, cur, 'As cláusulas de direitos autorais e uso de imagem permanecem válidas após rescisão.');

  clausula(doc, cur, '9. CONFIDENCIALIDADE');
  para(doc, cur, 'O CONTRATADO compromete-se a manter sigilo sobre todas as informações da CONTRATANTE.');
  para(doc, cur, 'Multa por violação: R$ 10.000,00, sem prejuízo de perdas e danos.');
  para(doc, cur, 'Aplica-se a Lei Geral de Proteção de Dados (LGPD).');

  clausula(doc, cur, '10. DISPOSIÇÕES GERAIS');
  itens(doc, cur, ['Não há vínculo empregatício entre as partes;', 'Cada parte responde por suas obrigações legais;', 'O contrato só pode ser alterado por escrito;', 'A nulidade de uma cláusula não invalida o restante.']);

  clausula(doc, cur, '11. FORO');
  para(doc, cur, 'Fica eleito o foro da Comarca de São Paulo/SP.');

  clausula(doc, cur, '12. ANEXO – CONDIÇÕES ESPECÍFICAS');
  paraLabel(doc, cur, 'Conteúdo:', row.descricaoConteudo || '—');
  para(doc, cur, 'Datas e horários:', { bold: true, gapAfter: 2 });
  itens(doc, cur, row.periodos.length ? row.periodos.map(periodoLinha) : ['—']);
  paraLabel(doc, cur, 'Valor:', `R$ ${row.valor}`);
  paraLabel(doc, cur, 'Pagamento:', row.dataPagamento || '—');
  paraLabel(doc, cur, 'Forma de pagamento:', row.formaPagamento || '—');

  clausula(doc, cur, 'ASSINATURAS');
  para(doc, cur, `São Paulo, ${dataExtenso(row.dataAssinatura)}.`);
  assinatura(doc, cur, 'PURE PILATES ACADEMY SERVIÇOS LTDA', 'CAROLINE LO DUCA SERRONI');
  assinatura(doc, cur, 'CONTRATADO', row.nome);
  assinatura(doc, cur, 'Testemunha 1', 'Nome: Caroline Vila Real Monsanto   RG: 32.423.177-5   CPF: 360.505.698-94');
  assinatura(doc, cur, 'Testemunha 2', 'Nome: Maria Luiza Joaquim   RG: 12.259.995-0   CPF: 012.365.668-07');

  return doc;
}

// Alíneas "a) ... b) ..." — itens indentados sem marcador.
function alineas(doc: jsPDF, cur: Cursor, lista: string[]): void {
  for (const it of lista) para(doc, cur, it, { indent: 14, gapAfter: 2 });
}

/** Contrato Wellhub (Eventos Externos) — jsPDF — para uma linha da planilha. */
export function buildContratoWellhubDoc(row: ContratoRow): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const cur: Cursor = { y: MARGIN };

  titulo(doc, cur, ['CONTRATO DE PRESTAÇÃO DE SERVIÇOS PROFISSIONAIS', 'PARA EVENTOS EXTERNOS – ÁREA DE PILATES']);

  paraLabel(doc, cur, 'CONTRATANTE:', 'ASSOCIAÇÃO DE REDE DE FRANQUIAS PURE PILATE, inscrita no CNPJ/ME sob nº 48.078.942/0001-19, com sede na Rua Herval, nº 816 e 824, Bairro Belenzinho, São Paulo/SP, CEP 03092-000.');
  paraLabel(doc, cur, `CONTRATADO: ${row.nome},`, `${row.nacionalidade}, ${row.estadoCivil}, ${row.profissao}, portador do RG sob nº ${row.rg}${row.orgaoEmissor ? ` ${row.orgaoEmissor}` : ''}, inscrito no CPF sob nº ${row.cpf}, residente ${row.endereco}, ${row.cidade} – ${row.uf} e CEP ${row.cep}.`);
  para(doc, cur, 'As partes acima identificadas têm entre si justo e contratado o presente instrumento, que se regerá pelas cláusulas abaixo:');

  clausula(doc, cur, 'CLÁUSULA 1 – DO OBJETO');
  para(doc, cur, '1.1. O presente contrato tem por objeto a prestação de serviços profissionais pelo(a) CONTRATADO(a) em ações, eventos externos, aulas demonstrativas, ativações e/ou atividades corporativas na área de Pilates e/ou atividades correlatas, organizadas ou intermediadas pela CONTRATANTE.');
  para(doc, cur, '1.2. Os serviços poderão incluir, mas não se limitam a:');
  itens(doc, cur, ['Condução de aulas ou práticas de Pilates;', 'Orientação corporal e postural;', 'Atendimento em eventos corporativos;', 'Participação em ações promocionais e institucionais.']);
  para(doc, cur, '1.3. As condições específicas de cada evento constarão em ANEXO, parte integrante deste contrato.');

  clausula(doc, cur, 'CLÁUSULA 2 – DA NATUREZA DA RELAÇÃO');
  para(doc, cur, '2.1. O presente contrato possui natureza estritamente civil e autônoma, não configurando vínculo empregatício entre as partes.');
  para(doc, cur, '2.2. O(a) CONTRATADO(a) exercerá suas atividades com autonomia técnica, sem subordinação jurídica, assumindo integral responsabilidade por sua atuação profissional.');
  para(doc, cur, '2.3. O(a) CONTRATADO(a) declara possuir habilitação profissional válida, bem como estar regularmente inscrito no respectivo conselho de classe, quando aplicável.');

  clausula(doc, cur, 'CLÁUSULA 3 – DAS OBRIGAÇÕES DO CONTRATADO');
  para(doc, cur, '3.1. São obrigações do(a) CONTRATADO(a):');
  alineas(doc, cur, [
    'a) Executar os serviços com zelo, ética e observância às normas técnicas da profissão;',
    'b) Comparecer ao local do evento com antecedência mínima acordada;',
    'c) Utilizar vestimenta adequada e conduta profissional compatível com o ambiente;',
    'd) Responsabilizar-se pela correta execução das atividades propostas;',
    'e) Zelar pela integridade física dos participantes durante as atividades;',
    'f) Não realizar procedimentos que extrapolem sua habilitação profissional;',
  ]);
  para(doc, cur, '3.2. O(a) CONTRATADO(a) declara ciência de que atua por sua conta e risco técnico, sendo responsável por eventuais danos decorrentes de imperícia, imprudência ou negligência.');

  clausula(doc, cur, 'CLÁUSULA 4 – DAS OBRIGAÇÕES DA CONTRATANTE');
  para(doc, cur, '4.1. São obrigações da CONTRATANTE:');
  alineas(doc, cur, [
    'a) Informar previamente as condições do evento (local, público, horário);',
    'b) Realizar o pagamento conforme estipulado em anexo;',
    'c) Intermediar a relação com o cliente contratante do evento;',
    'd) Fornecer, quando aplicável, estrutura básica para execução da atividade;',
  ]);

  clausula(doc, cur, 'CLÁUSULA 5 – DA REMUNERAÇÃO');
  para(doc, cur, '5.1. Pelos serviços prestados, o(a) CONTRATADO(a) receberá o valor descrito no ANEXO deste contrato.');
  para(doc, cur, '5.2. O pagamento será realizado na forma e prazo acordados, mediante fornecimento dos dados bancários pelo(a) CONTRATADO(a).');
  para(doc, cur, '5.3. Não haverá pagamento de qualquer verba adicional, tais como:');
  itens(doc, cur, ['horas extras;', 'encargos trabalhistas;', 'benefícios de natureza empregatícia.']);

  clausula(doc, cur, 'CLÁUSULA 6 – DA RESPONSABILIDADE CIVIL E PROFISSIONAL');
  para(doc, cur, '6.1. O(a) CONTRATADO(a) é integralmente responsável por sua atuação profissional, devendo observar as normas legais e éticas da sua categoria.');
  para(doc, cur, '6.2. A CONTRATANTE não se responsabiliza por:');
  itens(doc, cur, ['acidentes decorrentes da execução técnica do serviço;', 'danos causados a terceiros pelo CONTRATADO;', 'eventuais intercorrências clínicas durante as atividades.']);
  para(doc, cur, '6.3. Recomenda-se que o(a) CONTRATADO(a) possua seguro de responsabilidade civil profissional, sendo este de sua exclusiva responsabilidade.');

  clausula(doc, cur, 'CLÁUSULA 7 – DO USO DE IMAGEM');
  para(doc, cur, '7.1. O(a) CONTRATADO(a) autoriza o uso de sua imagem, nome e voz para fins institucionais e promocionais da CONTRATANTE, sem ônus adicional, salvo disposição em contrário no ANEXO.');

  clausula(doc, cur, 'CLÁUSULA 8 – DO PRAZO E RESCISÃO');
  para(doc, cur, '8.1. Este contrato é válido por prazo indeterminado, vinculando-se às execuções previstas em cada ANEXO.');
  para(doc, cur, '8.2. O descumprimento de qualquer cláusula poderá ensejar rescisão imediata, sem prejuízo de perdas e danos.');
  para(doc, cur, '8.3. Em caso de ausência injustificada no evento, poderá ser aplicada multa equivalente ao valor do serviço contratado.');

  clausula(doc, cur, 'CLÁUSULA 9 – DA CONFIDENCIALIDADE E LGPD');
  para(doc, cur, '9.1. O(a) CONTRATADO(a) compromete-se a manter sigilo sobre quaisquer informações obtidas durante a prestação dos serviços.');
  para(doc, cur, '9.2. As partes comprometem-se a cumprir a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).');

  clausula(doc, cur, 'CLÁUSULA 10 – DA INEXISTÊNCIA DE VÍNCULO TRABALHISTA');
  para(doc, cur, '10.1. Fica expressamente pactuado que este contrato não gera vínculo empregatício, nos termos da legislação vigente.');
  para(doc, cur, '10.2. O(a) CONTRATADO(a) é responsável por seus encargos fiscais, previdenciários e trabalhistas.');
  para(doc, cur, '10.3. Caso haja qualquer questionamento judicial, o(a) CONTRATADO(a) se compromete a isentar a CONTRATANTE de qualquer responsabilidade, inclusive com reembolso de custos.');

  clausula(doc, cur, 'CLÁUSULA 11 – DO FORO');
  para(doc, cur, 'Fica eleito o foro da Comarca de São Paulo/SP para dirimir quaisquer controvérsias.');
  para(doc, cur, 'E, por estarem de acordo, as partes assinam o presente instrumento.');

  clausula(doc, cur, 'ANEXO – CONDIÇÕES DO EVENTO');
  paraLabel(doc, cur, 'Local:', row.local || '—');
  paraLabel(doc, cur, 'Data:', row.dataEvento || '—');
  paraLabel(doc, cur, 'Horário:', row.horario || '—');
  paraLabel(doc, cur, 'Atividade:', row.atividade || '—');
  paraLabel(doc, cur, 'Valor:', `R$ ${row.valor}`);
  paraLabel(doc, cur, 'Pagamento:', row.prazoPagamento || '—');
  para(doc, cur, 'Dados para pagamento:', { bold: true, gapAfter: 2 });
  paraLabel(doc, cur, 'PIX:', row.pix || '—');
  paraLabel(doc, cur, 'Email:', row.email || '—');

  para(doc, cur, `São Paulo, ${dataExtenso(row.dataAssinatura)}.`, { gapAfter: 6 });
  assinatura(doc, cur, 'CONTRATANTE: ASSOCIAÇÃO DE REDE DE FRANQUIAS PURE PILATE', 'CNPJ: 48.078.942/0001-19');
  assinatura(doc, cur, 'CONTRATADA', `${row.nome}   CPF: ${row.cpf}`);
  assinatura(doc, cur, 'Testemunha 1', 'Nome: Caroline Vila Real Monsanto   RG: 32.423.177-5   CPF: 360.505.698-94');
  assinatura(doc, cur, 'Testemunha 2', 'Nome: Maria Luiza Joaquim   RG: 12.259.995-0   CPF: 012.365.668-07');

  return doc;
}

/** Blob PDF a partir do doc jsPDF. */
export function docToPdfBlob(doc: jsPDF): Blob {
  return doc.output('blob');
}
