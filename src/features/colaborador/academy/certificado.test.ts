import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { formatDate, parsePlanilha, certFileName, normalizeHeader } from './certificado';

// Serial do Excel = dias desde 1899-12-30. É assim que uma planilha real guarda
// data — o formato de exibição (numFmt) é só uma máscara por cima.
const serial = (y: number, m: number, d: number) =>
  Math.round((Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 86400000);

/** Monta um .xlsx com INICIO=7/mar/2026 e CONCLUSAO=3/jul/2026 exibidas no formato `z`. */
function planilhaComFormato(z: string): File {
  const ws = XLSX.utils.aoa_to_sheet([
    ['NOME', 'CPF', 'CURSO', 'CARGA HORARIA', 'INICIO', 'CONCLUSAO'],
    ['Maria Silva', '123.456.789-00', 'Pilates Básico', '40', null, null],
  ]);
  ws['E2'] = { t: 'n', v: serial(2026, 3, 7), z };
  ws['F2'] = { t: 'n', v: serial(2026, 7, 3), z };
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Plan1');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new File([buf], 'formandos.xlsx');
}

/** Mesma planilha, mas com as datas digitadas como TEXTO. */
function planilhaComTexto(inicio: string, conclusao: string): File {
  const ws = XLSX.utils.aoa_to_sheet([
    ['NOME', 'CPF', 'CURSO', 'CARGA HORARIA', 'INICIO', 'CONCLUSAO'],
    ['Maria Silva', '123.456.789-00', 'Pilates Básico', '40', inicio, conclusao],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Plan1');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new File([buf], 'formandos.xlsx');
}

describe('parsePlanilha — datas', () => {
  // O formato de exibição da célula não pode influenciar a data impressa:
  // é sempre 7 de março e 3 de julho, escrito em pt-BR.
  it.each([
    ['dd/mm/yyyy', 'Excel pt-BR'],
    ['m/d/yy', 'Excel en-US'],
    ['mm/dd/yyyy', 'Excel en-US (4 dígitos)'],
    ['yyyy-mm-dd', 'ISO'],
    ['d-mmm-yy', 'por extenso'],
  ])('formato de célula "%s" (%s) sai em dd/mm/aaaa', async (z) => {
    const { rows } = await parsePlanilha(planilhaComFormato(z));
    expect(rows).toHaveLength(1);
    expect(rows[0].inicio).toBe('07/03/2026');
    expect(rows[0].conclusao).toBe('03/07/2026');
  });

  it('preserva a máscara do CPF e os demais campos', async () => {
    const { rows, missingColumns } = await parsePlanilha(planilhaComFormato('m/d/yy'));
    expect(missingColumns).toEqual([]);
    expect(rows[0]).toMatchObject({
      nome: 'Maria Silva',
      cpf: '123.456.789-00',
      curso: 'Pilates Básico',
      cargaHoraria: '40',
    });
  });

  it('data digitada como texto continua sendo lida como dd/mm', async () => {
    const { rows } = await parsePlanilha(planilhaComTexto('07/03/2026', '03/07/2026'));
    expect(rows[0].inicio).toBe('07/03/2026');
    expect(rows[0].conclusao).toBe('03/07/2026');
  });
});

describe('formatDate', () => {
  it('aceita ISO', () => {
    expect(formatDate('2026-03-07')).toBe('07/03/2026');
  });

  it('aceita dd/mm/aaaa e normaliza o zero à esquerda', () => {
    expect(formatDate('7/3/2026')).toBe('07/03/2026');
    expect(formatDate('07.03.2026')).toBe('07/03/2026');
    expect(formatDate('07-03-2026')).toBe('07/03/2026');
  });

  it('expande ano de 2 dígitos', () => {
    expect(formatDate('07/03/26')).toBe('07/03/2026');
  });

  it('desinverte texto mm/dd quando o mês seria impossível', () => {
    // "17" não existe como mês -> a planilha é mm/dd, não dd/mm.
    expect(formatDate('7/17/2026')).toBe('17/07/2026');
  });

  it('vazio vira string vazia', () => {
    expect(formatDate('')).toBe('');
    expect(formatDate('   ')).toBe('');
  });

  // O CertificadoCanvas chama formatDate() por cima do valor que o parse já
  // normalizou, então reformatar não pode mexer no resultado.
  it('é idempotente', () => {
    for (const d of ['07/03/2026', '03/07/2026', '17/07/2026', '31/12/2026', '']) {
      expect(formatDate(formatDate(d))).toBe(formatDate(d));
    }
  });

  it('texto que não é data passa direto', () => {
    expect(formatDate('a definir')).toBe('a definir');
  });
});

describe('normalizeHeader', () => {
  it('remove acento, espaço extra e caixa', () => {
    expect(normalizeHeader(' Início ')).toBe('INICIO');
    expect(normalizeHeader('Carga  Horária')).toBe('CARGA HORARIA');
  });
});

describe('certFileName', () => {
  it('remove caracteres inválidos de caminho', () => {
    expect(certFileName('Maria/Silva')).toBe('Certificado - MariaSilva.pdf');
  });

  it('cai num nome padrão se vier vazio', () => {
    expect(certFileName('')).toBe('Certificado - certificado.pdf');
  });
});
