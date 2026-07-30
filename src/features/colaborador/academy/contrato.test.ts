import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { parsePlanilha, contratoFileName } from './contrato';

const serial = (y: number, m: number, d: number) =>
  Math.round((Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 86400000);

/** Monta um .xlsx de contrato de gravação com os períodos numa coluna só. */
function planilha(): File {
  const headers = [
    'NOME COMPLETO', 'NACIONALIDADE', 'ESTADO CIVIL', 'PROFISSAO', 'RG', 'ORGAO EMISSOR RG',
    'CPF', 'ENDERECO COMPLETO', 'CEP', 'CIDADE', 'UF', 'CONTEUDO', 'DESCRICAO CONTEUDO',
    'PERIODOS', 'VALOR', 'DATA PAGAMENTO', 'FORMA PAGAMENTO', 'DATA ASSINATURA',
  ];
  const row = [
    'Geraldo Paes Rufino', 'Brasileiro', 'Solteiro', 'Fisioterapeuta', '11.193.108-5', 'DETRAN/RJ',
    '083.433.767-30', 'Rua Salvador de Edra, 77', '04055-010', 'São Paulo', 'SP',
    'Gravação de Campanha', 'Campanha, reels e teasers',
    '09/07/2026, 09:00, 13:00, A\n09/07/2026, 14:00, 18:00, A\n10/07/2026, 09:00, 13:00, F',
    '600,00', '', 'PIX', '',
  ];
  const ws = XLSX.utils.aoa_to_sheet([headers, row]);
  const col = (name: string) => headers.indexOf(name);
  const set = (name: string, y: number, m: number, d: number) => {
    const c = XLSX.utils.encode_cell({ r: 1, c: col(name) });
    ws[c] = { t: 'n', v: serial(y, m, d), z: 'dd/mm/yyyy' };
  };
  set('DATA PAGAMENTO', 2026, 7, 8);
  set('DATA ASSINATURA', 2026, 7, 6);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Contratos');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new File([buf], 'contratos.xlsx');
}

describe('parsePlanilha — contrato de gravação', () => {
  it('mapeia os campos do contratado', async () => {
    const { rows, missingColumns } = await parsePlanilha(planilha(), 'gravacao');
    expect(missingColumns).toEqual([]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      nome: 'Geraldo Paes Rufino',
      nacionalidade: 'Brasileiro',
      estadoCivil: 'Solteiro',
      profissao: 'Fisioterapeuta',
      rg: '11.193.108-5',
      orgaoEmissor: 'DETRAN/RJ',
      cpf: '083.433.767-30',
      cidade: 'São Paulo',
      uf: 'SP',
      valor: '600,00',
      formaPagamento: 'PIX',
    });
  });

  it('quebra a coluna PERIODOS em uma linha por período', async () => {
    const { rows } = await parsePlanilha(planilha(), 'gravacao');
    expect(rows[0].periodos).toHaveLength(3);
    expect(rows[0].periodos[0]).toEqual({ data: '09/07/2026', inicio: '09:00', fim: '13:00', tipo: 'A' });
    expect(rows[0].periodos[2]).toEqual({ data: '10/07/2026', inicio: '09:00', fim: '13:00', tipo: 'F' });
  });

  it('normaliza as datas (célula tipada → dd/mm/aaaa)', async () => {
    const { rows } = await parsePlanilha(planilha(), 'gravacao');
    expect(rows[0].dataAssinatura).toBe('06/07/2026');
    expect(rows[0].dataPagamento).toBe('08/07/2026');
  });

  it('avisa colunas obrigatórias faltando', async () => {
    const ws = XLSX.utils.aoa_to_sheet([['NOME COMPLETO'], ['Fulano']]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'C');
    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const { rows, missingColumns } = await parsePlanilha(new File([buf], 'c.xlsx'), 'gravacao');
    expect(rows).toHaveLength(1);
    expect(missingColumns).toContain('CPF');
    expect(missingColumns).toContain('VALOR');
  });
});

describe('contratoFileName', () => {
  it('inclui o tipo e sanitiza o nome', () => {
    expect(contratoFileName('Geraldo/Rufino', 'gravacao')).toBe('Contrato Gravacao - GeraldoRufino.pdf');
    expect(contratoFileName('', 'wellhub')).toBe('Contrato Wellhub - contrato.pdf');
  });
});
