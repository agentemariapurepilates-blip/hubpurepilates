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

const pad = (n: number | string) => String(n).padStart(2, '0');

// Formata uma célula de data do Excel (Date) em "dd/mm/aaaa". É o caminho
// preferido: o valor tipado é inequívoco, diferente da string formatada, que
// depende do locale de quem salvou a planilha. O SheetJS já normaliza o serial
// pro fuso local, então os getters locais são os corretos aqui.
export function dateToBR(d: Date): string {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

// Normaliza uma data em TEXTO pra "dd/mm/aaaa" (aceita ISO "aaaa-mm-dd" ou
// separadores . - /). Só é usada quando a planilha traz a data como texto —
// datas de verdade passam por dateToBR() e nem chegam aqui.
export function formatDate(value: string): string {
  const v = (value ?? '').toString().trim();
  if (!v) return '';

  const iso = v.match(/^(\d{4})\D(\d{1,2})\D(\d{1,2})/);
  if (iso) return `${pad(iso[3])}/${pad(iso[2])}/${iso[1]}`;

  const dmy = v.match(/^(\d{1,2})\D(\d{1,2})\D(\d{2,4})/);
  if (dmy) {
    let dia = Number(dmy[1]);
    let mes = Number(dmy[2]);
    // Texto "d/m" é ambíguo: 3/7 é 3 de julho aqui e 7 de março nos EUA.
    // Assumimos dd/mm (planilha brasileira), mas se o 1º número não puder ser
    // dia e o 2º puder, a planilha é claramente mm/dd — aí desinvertemos em vez
    // de imprimir "mês 17" no certificado.
    if (mes > 12 && dia <= 12) [dia, mes] = [mes, dia];
    const yyyy = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
    return `${pad(dia)}/${pad(mes)}/${yyyy}`;
  }
  return v;
}

function mapRecord(raw: Record<string, unknown>, typed: Record<string, unknown>): CertRow {
  const row: CertRow = { nome: '', cpf: '', curso: '', cargaHoraria: '', inicio: '', conclusao: '' };
  for (const [key, value] of Object.entries(raw)) {
    const field = HEADER_TO_FIELD[normalizeHeader(key)];
    if (!field) continue;
    // Nas datas, prefere o valor tipado da célula; a string formatada só entra
    // como fallback (data digitada como texto).
    if (field === 'inicio' || field === 'conclusao') {
      const cell = typed[key];
      if (cell instanceof Date && !Number.isNaN(cell.getTime())) {
        row[field] = dateToBR(cell);
        continue;
      }
    }
    row[field] = value == null ? '' : String(value).trim();
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

  // Dois passes propositais:
  // - raw:false  -> tudo como texto já formatado (preserva máscara de CPF etc).
  // - raw:true   -> células de data como Date de verdade (com cellDates acima).
  // As datas saem do 2º; todo o resto do 1º. Só o raw:false não basta: ele
  // formata a data usando o formato da PRÓPRIA célula (o dateNF é só fallback),
  // então uma planilha salva em locale en-US devolvia "3/7/26" e o dia virava
  // mês — o certificado saía com a data trocada.
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
    raw: false,
    dateNF: 'dd/mm/yyyy',
  });
  const typed = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
    raw: true,
  });

  const headers = json.length ? Object.keys(json[0]) : [];
  const present = new Set(headers.map(normalizeHeader));
  const missingColumns = REQUIRED_HEADERS.filter((h) => !present.has(h));

  const rows = json.map((r, i) => mapRecord(r, typed[i] ?? {})).filter((r) => r.nome);
  return { rows, headers, missingColumns };
}

// Nome de arquivo seguro pra cada certificado dentro do ZIP.
export function certFileName(nome: string): string {
  const clean = (nome || 'certificado')
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return `Certificado - ${clean}.pdf`;
}
