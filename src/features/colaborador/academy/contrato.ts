import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { normalizeHeader, formatDate, dateToBR } from './certificado';

// Opções do dropdown "CONTEUDO" na planilha-modelo.
export const CONTEUDO_OPCOES = [
  'Gravação de Curso',
  'Gravação de Reels',
  'Gravação de Campanha',
  'Participação em Workshop',
  'Produção de Material Complementar',
  'Outro',
];

// Reaproveita o padrão da automação de certificados (upload .xlsx → parse
// SheetJS → 1 documento por linha → ZIP). Aqui a saída é um PDF de contrato.

export type ContratoTipo = 'gravacao' | 'wellhub';

/** Um período de gravação do Anexo (condicional, até 5 por contrato). */
export interface Periodo {
  data: string; // dd/mm/aaaa
  inicio: string; // ex.: "09:00" ou "09"
  fim: string;
  tipo: string; // A (Aula) / F (Foto/Filmagem) / Outro
}

export interface ContratoRow {
  // 1. Dados do contratado
  nome: string;
  nacionalidade: string;
  estadoCivil: string;
  profissao: string;
  rg: string;
  orgaoEmissor: string;
  cpf: string;
  endereco: string;
  cep: string;
  cidade: string;
  uf: string;
  // 2. Serviço contratado
  conteudo: string;
  descricaoConteudo: string;
  // 3. Períodos (condicionais) — só no contrato de Gravação
  periodos: Periodo[];
  // 4. Remuneração
  valor: string;
  dataPagamento: string;
  formaPagamento: string;
  // 5. Assinatura
  dataAssinatura: string;
  // 6. Anexo do evento — só no contrato Wellhub (eventos externos)
  local: string;
  dataEvento: string;
  horario: string;
  atividade: string;
  prazoPagamento: string;
  pix: string;
  email: string;
}

// Aliases de cabeçalho (normalizados) → campo. Aceita algumas variações comuns.
const HEADER_TO_FIELD: Record<string, keyof ContratoRow> = {
  'NOME COMPLETO': 'nome',
  NOME: 'nome',
  'NOME DO CONTRATADO': 'nome',
  NACIONALIDADE: 'nacionalidade',
  'ESTADO CIVIL': 'estadoCivil',
  PROFISSAO: 'profissao',
  RG: 'rg',
  'ORGAO EMISSOR RG': 'orgaoEmissor',
  'ORGAO EMISSOR': 'orgaoEmissor',
  'ORGAO EMISSOR DO RG': 'orgaoEmissor',
  CPF: 'cpf',
  'ENDERECO COMPLETO': 'endereco',
  ENDERECO: 'endereco',
  CEP: 'cep',
  CIDADE: 'cidade',
  UF: 'uf',
  'ESTADO (UF)': 'uf',
  ESTADO: 'uf',
  CONTEUDO: 'conteudo',
  'CONTEUDO CONTRATADO': 'conteudo',
  'DESCRICAO CONTEUDO': 'descricaoConteudo',
  'DESCRICAO DO CONTEUDO': 'descricaoConteudo',
  VALOR: 'valor',
  'VALOR DO CONTRATO': 'valor',
  'VALOR (R$)': 'valor',
  'DATA PAGAMENTO': 'dataPagamento',
  'DATA DO PAGAMENTO': 'dataPagamento',
  'FORMA PAGAMENTO': 'formaPagamento',
  'FORMA DE PAGAMENTO': 'formaPagamento',
  'DATA ASSINATURA': 'dataAssinatura',
  'DATA DA ASSINATURA': 'dataAssinatura',
  // Wellhub — anexo do evento
  LOCAL: 'local',
  'LOCAL DO EVENTO': 'local',
  'DATA EVENTO': 'dataEvento',
  'DATA DO EVENTO': 'dataEvento',
  HORARIO: 'horario',
  'HORARIO DO EVENTO': 'horario',
  ATIVIDADE: 'atividade',
  'PRAZO PAGAMENTO': 'prazoPagamento',
  'PRAZO DE PAGAMENTO': 'prazoPagamento',
  PIX: 'pix',
  'CHAVE PIX': 'pix',
  EMAIL: 'email',
  'E-MAIL': 'email',
};

// Campos de data (recebem tratamento tipado do SheetJS + normalização dd/mm/aaaa).
const DATE_FIELDS = new Set<keyof ContratoRow>(['dataPagamento', 'dataAssinatura', 'dataEvento']);

const REQUIRED_BY_TIPO: Record<ContratoTipo, string[]> = {
  gravacao: ['NOME COMPLETO', 'CPF', 'CONTEUDO', 'VALOR', 'DATA ASSINATURA'],
  wellhub: ['NOME COMPLETO', 'CPF', 'LOCAL', 'DATA EVENTO', 'VALOR', 'DATA ASSINATURA'],
};

// Cabeçalhos da planilha-modelo, por tipo (ordem de coluna).
// Períodos ficam numa ÚNICA coluna "PERIODOS" (um por linha: data, início, fim, tipo).
const TEMPLATE_HEADERS: Record<ContratoTipo, string[]> = {
  gravacao: [
    'NOME COMPLETO', 'NACIONALIDADE', 'ESTADO CIVIL', 'PROFISSAO', 'RG', 'ORGAO EMISSOR RG',
    'CPF', 'ENDERECO COMPLETO', 'CEP', 'CIDADE', 'UF',
    'CONTEUDO', 'DESCRICAO CONTEUDO',
    'PERIODOS',
    'VALOR', 'DATA PAGAMENTO', 'FORMA PAGAMENTO', 'DATA ASSINATURA',
  ],
  wellhub: [
    'NOME COMPLETO', 'NACIONALIDADE', 'ESTADO CIVIL', 'PROFISSAO', 'RG', 'ORGAO EMISSOR RG',
    'CPF', 'ENDERECO COMPLETO', 'CEP', 'CIDADE', 'UF',
    'LOCAL', 'DATA EVENTO', 'HORARIO', 'ATIVIDADE',
    'VALOR', 'PRAZO PAGAMENTO', 'PIX', 'EMAIL', 'DATA ASSINATURA',
  ],
};

// Linha de exemplo na planilha-modelo (deixa claro o formato dos campos).
const EXEMPLO: Partial<Record<ContratoTipo, string[]>> = {
  gravacao: [
    'EXEMPLO — apague esta linha', 'Brasileiro(a)', 'Solteiro(a)', 'Fisioterapeuta',
    '11.193.108-5', 'DETRAN/RJ', '083.433.767-30', 'Rua Alegre, 123, Apto 4, Bairro Centro',
    '04055-010', 'São Paulo', 'SP', 'Gravação de Campanha', 'Gravação de campanha, reels e teasers',
    '09/07/2026, 09:00, 13:00, A\n09/07/2026, 14:00, 18:00, A\n10/07/2026, 09:00, 13:00, F',
    '600,00', '08/07/2026', 'PIX', '06/07/2026',
  ],
  wellhub: [
    'EXEMPLO — apague esta linha', 'Brasileira', 'Casada', 'Fisioterapeuta',
    '30.301.301-1', 'SSP/SP', '322.819.088-95', 'Rua Fruta do Paraíso, 230, Vila Jacuí',
    '08050-050', 'São Paulo', 'SP',
    'VR SP – Av. dos Bandeirantes, 460 - Brooklin', '30/04/2026', '9 às 11hs', 'Aula/ação de Pilates corporativo',
    '170,00', 'Até 08/05/2026', '11 94116 1650', 'laranjeira.paula@hotmail.com', '30/04/2026',
  ],
};

// Um período por linha; campos separados por vírgula (ou |). Aceita ";" entre períodos.
function parsePeriodos(raw: string): Periodo[] {
  if (!raw || !raw.trim()) return [];
  return raw
    .split(/\r?\n|;/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((linha) => {
      const [data = '', inicio = '', fim = '', tipo = ''] = linha.split(/\s*[,|]\s*/);
      return { data: data ? formatDate(data) : '', inicio, fim, tipo };
    })
    .filter((p) => p.data || p.inicio || p.fim || p.tipo);
}

function emptyRow(): ContratoRow {
  return {
    nome: '', nacionalidade: '', estadoCivil: '', profissao: '', rg: '', orgaoEmissor: '',
    cpf: '', endereco: '', cep: '', cidade: '', uf: '', conteudo: '', descricaoConteudo: '',
    periodos: [], valor: '', dataPagamento: '', formaPagamento: '', dataAssinatura: '',
    local: '', dataEvento: '', horario: '', atividade: '', prazoPagamento: '', pix: '', email: '',
  };
}

// Mapa header-normalizado → valor, pra um registro do SheetJS.
function normalizedMap(rec: Record<string, unknown>): Map<string, unknown> {
  const m = new Map<string, unknown>();
  for (const [k, v] of Object.entries(rec)) m.set(normalizeHeader(k), v);
  return m;
}

function buildRow(textRec: Record<string, unknown>, typedRec: Record<string, unknown>): ContratoRow {
  const text = normalizedMap(textRec);
  const typed = normalizedMap(typedRec);

  const raw = (key: string): string => {
    const v = text.get(key);
    return v == null ? '' : String(v).trim();
  };
  // Data: prefere a célula tipada (Date) do SheetJS; senão normaliza o texto.
  const dateBR = (key: string): string => {
    const tv = typed.get(key);
    if (tv instanceof Date && !Number.isNaN(tv.getTime())) return dateToBR(tv);
    const r = raw(key);
    return r ? formatDate(r) : '';
  };

  const row = emptyRow();
  // Campos simples via HEADER_TO_FIELD.
  for (const [header, field] of Object.entries(HEADER_TO_FIELD)) {
    if (!text.has(header)) continue;
    const value = DATE_FIELDS.has(field) ? dateBR(header) : raw(header);
    if (value) row[field] = value as never;
  }

  // Períodos: uma coluna só ("PERIODOS"), um período por linha.
  row.periodos = parsePeriodos(raw('PERIODOS'));

  return row;
}

export interface ParseResult {
  rows: ContratoRow[];
  headers: string[];
  missingColumns: string[];
}

export async function parsePlanilha(file: File, tipo: ContratoTipo): Promise<ParseResult> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array', cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return { rows: [], headers: [], missingColumns: REQUIRED_BY_TIPO[tipo] };

  // Dois passes (igual aos certificados): raw:false preserva texto/máscara;
  // raw:true traz datas como Date de verdade.
  const textJson = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '', raw: false, dateNF: 'dd/mm/yyyy',
  });
  const typedJson = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '', raw: true,
  });

  const headers = textJson.length ? Object.keys(textJson[0]) : [];
  const present = new Set(headers.map(normalizeHeader));
  const missingColumns = REQUIRED_BY_TIPO[tipo].filter((h) => !present.has(h));

  const rows = textJson
    .map((r, i) => buildRow(r, typedJson[i] ?? {}))
    .filter((r) => r.nome);

  return { rows, headers, missingColumns };
}

// Nome de arquivo seguro pra cada contrato dentro do ZIP.
export function contratoFileName(nome: string, tipo: ContratoTipo): string {
  const label = tipo === 'gravacao' ? 'Gravacao' : 'Wellhub';
  const clean = (nome || 'contrato')
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return `Contrato ${label} - ${clean}.pdf`;
}

// Cores da marca (ARGB — FF de alpha).
const PURE_VERMELHO = 'FFC12030';

// O SheetJS grátis não escreve estilos nem validações, então editamos o XML do
// .xlsx via JSZip: (1) cabeçalho vermelho Pure com texto branco negrito e
// (2) dropdown "suave" no CONTEUDO (sugere as opções mas permite digitar outro).
async function estilizarEValidar(
  xlsxBytes: Uint8Array,
  dropdown: { col: string; opcoes: string[] } | null,
): Promise<Uint8Array> {
  const zip = await JSZip.loadAsync(xlsxBytes);

  // (1) styles.xml — adiciona fonte (branca+negrito), fill (vermelho) e um cellXf.
  let headerXf = 0;
  const stylesFile = zip.file('xl/styles.xml');
  if (stylesFile) {
    let styles = await stylesFile.async('string');
    const fontsCount = Number(styles.match(/<fonts count="(\d+)"/)?.[1] ?? 0);
    const fillsCount = Number(styles.match(/<fills count="(\d+)"/)?.[1] ?? 0);
    const xfsCount = Number(styles.match(/<cellXfs count="(\d+)"/)?.[1] ?? 0);
    if (fontsCount && fillsCount && xfsCount) {
      styles = styles
        .replace(/<fonts count="\d+"/, `<fonts count="${fontsCount + 1}"`)
        .replace('</fonts>', '<font><b/><sz val="12"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font></fonts>')
        .replace(/<fills count="\d+"/, `<fills count="${fillsCount + 1}"`)
        .replace('</fills>', `<fill><patternFill patternType="solid"><fgColor rgb="${PURE_VERMELHO}"/><bgColor indexed="64"/></patternFill></fill></fills>`)
        .replace(/<cellXfs count="\d+"/, `<cellXfs count="${xfsCount + 1}"`)
        .replace('</cellXfs>', `<xf numFmtId="0" fontId="${fontsCount}" fillId="${fillsCount}" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf></cellXfs>`);
      headerXf = xfsCount;
      zip.file('xl/styles.xml', styles);
    }
  }

  // (2) sheet1.xml — estiliza a linha 1 e injeta o dropdown.
  const sheetFile = zip.file('xl/worksheets/sheet1.xml');
  if (sheetFile) {
    let sheet = await sheetFile.async('string');
    if (headerXf) {
      sheet = sheet.replace(/<row r="1"([^>]*)>([\s\S]*?)<\/row>/, (_all, attrs, inner) => {
        const styled = inner.replace(/<c ([^>]*)>/g, `<c $1 s="${headerXf}">`);
        return `<row r="1"${attrs} ht="28" customHeight="1">${styled}</row>`;
      });
    }
    if (dropdown) {
      const lista = dropdown.opcoes.join(',');
      const dv =
        `<dataValidations count="1">` +
        `<dataValidation type="list" allowBlank="1" showInputMessage="1" showErrorMessage="0" sqref="${dropdown.col}2:${dropdown.col}1000">` +
        `<formula1>"${lista}"</formula1></dataValidation></dataValidations>`;
      // dataValidations vem antes de pageMargins/hyperlinks/etc. (ordem do schema).
      const anchor = ['<pageMargins', '<pageSetup', '<headerFooter', '<drawing', '</worksheet>'].find((t) => sheet.includes(t))!;
      sheet = sheet.replace(anchor, dv + anchor);
    }
    zip.file('xl/worksheets/sheet1.xml', sheet);
  }

  return zip.generateAsync({ type: 'uint8array' });
}

// Bytes da planilha-modelo (cabeçalho colorido + dropdown no CONTEUDO). Sem download.
export async function gerarPlanilhaModeloBytes(tipo: ContratoTipo): Promise<Uint8Array> {
  const headers = TEMPLATE_HEADERS[tipo];
  const exemplo = EXEMPLO[tipo];
  const ws = XLSX.utils.aoa_to_sheet(exemplo ? [headers, exemplo] : [headers]);
  // Larguras amigáveis (colunas de texto longo mais largas).
  const largas = new Set(['PERIODOS', 'ENDERECO COMPLETO', 'DESCRICAO CONTEUDO', 'LOCAL', 'ATIVIDADE', 'EMAIL']);
  ws['!cols'] = headers.map((h) => (h === 'PERIODOS' ? { wch: 42 } : largas.has(h) ? { wch: 30 } : { wch: 16 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Contratos');
  const bytes = new Uint8Array(XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer);

  // Dropdown "suave" só onde existe a coluna CONTEUDO (contrato de Gravação).
  const conteudoIdx = headers.indexOf('CONTEUDO');
  const dropdown = conteudoIdx >= 0
    ? { col: XLSX.utils.encode_col(conteudoIdx), opcoes: CONTEUDO_OPCOES }
    : null;
  return estilizarEValidar(bytes, dropdown);
}

// Gera e baixa a planilha-modelo pro tipo escolhido.
export async function baixarPlanilhaModelo(tipo: ContratoTipo): Promise<void> {
  const bytes = await gerarPlanilhaModeloBytes(tipo);
  const nome = tipo === 'gravacao' ? 'Modelo - Contrato Gravacao.xlsx' : 'Modelo - Contrato Wellhub.xlsx';
  const blob = new Blob([bytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
