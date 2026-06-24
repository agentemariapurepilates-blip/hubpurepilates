import * as XLSX from 'xlsx';

// Fundo (A4 paisagem, 300 DPI) exportado do Canva contendo SÓ os gráficos
// (brasão, título "CERTIFICADO", rabisco, assinatura, logo, rodapé) — sem o
// texto do corpo e sem as linhas. Todo o corpo é renderizado em HTML por cima.
export const CERT_BG = '/certificado-academy-base.png';
export const BASE_W = 3508;
export const BASE_H = 2480;

// Tamanhos de fonte vindos do Canva (73,5 fixo / 77,5 editável) convertidos pra
// px na resolução base. Fator medido no certificado original: 73,5 ≈ 96px.
export const CANVA_TO_PX = 96 / 73.5;
export const FIXED_PX = Math.round(73.5 * CANVA_TO_PX); // ~96  (rótulos, Montserrat regular)
export const VALUE_PX = Math.round(77.5 * CANVA_TO_PX); // ~101 (valores, Montserrat bold + sublinhado)
export const TEXT_COLOR = '#2d2d2d';

export interface CertRow {
  nome: string;
  cpf: string;
  curso: string;
  cargaHoraria: string;
  inicio: string;
  conclusao: string;
}

// Normaliza um cabeçalho de coluna: sem acento, sem espaços extras, MAIÚSCULO.
export function normalizeHeader(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

const HEADER_TO_FIELD: Record<string, keyof CertRow> = {
  NOME: 'nome',
  CPF: 'cpf',
  CURSO: 'curso',
  'CARGA HORARIA': 'cargaHoraria',
  INICIO: 'inicio',
  CONCLUSAO: 'conclusao',
};

// Normaliza uma data pra "dd/mm/aaaa" (aceita ISO "aaaa-mm-dd" ou separadores . - /).
export function formatDate(value: string): string {
  const v = (value ?? '').toString().trim();
  if (!v) return '';

  const iso = v.match(/^(\d{4})\D(\d{1,2})\D(\d{1,2})/);
  if (iso) return `${iso[3].padStart(2, '0')}/${iso[2].padStart(2, '0')}/${iso[1]}`;

  const br = v.match(/^(\d{1,2})\D(\d{1,2})\D(\d{2,4})/);
  if (br) {
    const yyyy = br[3].length === 2 ? `20${br[3]}` : br[3];
    return `${br[1].padStart(2, '0')}/${br[2].padStart(2, '0')}/${yyyy}`;
  }
  return v;
}

function mapRecord(raw: Record<string, unknown>): CertRow {
  const row: CertRow = { nome: '', cpf: '', curso: '', cargaHoraria: '', inicio: '', conclusao: '' };
  for (const [key, value] of Object.entries(raw)) {
    const field = HEADER_TO_FIELD[normalizeHeader(key)];
    if (field) row[field] = value == null ? '' : String(value).trim();
  }
  return row;
}

export interface ParseResult {
  rows: CertRow[];
  headers: string[];
  missingColumns: string[];
}

const REQUIRED_HEADERS = ['NOME', 'CPF', 'CURSO', 'CARGA HORARIA', 'INICIO', 'CONCLUSAO'];

// Lê a 1ª aba de um .xlsx/.csv e devolve os formandos + diagnóstico de colunas.
export async function parsePlanilha(file: File): Promise<ParseResult> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array', cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return { rows: [], headers: [], missingColumns: REQUIRED_HEADERS };

  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
    raw: false,
    dateNF: 'dd/mm/yyyy',
  });

  const headers = json.length ? Object.keys(json[0]) : [];
  const present = new Set(headers.map(normalizeHeader));
  const missingColumns = REQUIRED_HEADERS.filter((h) => !present.has(h));

  const rows = json.map(mapRecord).filter((r) => r.nome);
  return { rows, headers, missingColumns };
}

// Nome de arquivo seguro pra cada certificado dentro do ZIP.
export function certFileName(nome: string): string {
  const clean = (nome || 'certificado')
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return `Certificado - ${clean}.png`;
}
