import { describe, it, expect } from 'vitest';
import * as csv from '../../../../../scripts/lib/leads-csv.mjs';
import { normalizarLead } from './leads';
import { mesclarLeads } from '../../../../../scripts/lib/mescla-leads.mjs';

// O Meta só guarda lead por 90 dias, então março a julho só existe em cópias de
// fora (a agência, uma planilha). Estes testes cobrem a leitura dessa cópia: ela
// tem que virar EXATAMENTE o que a Graph API entregaria, senão a tela e a
// mescla tratam o lead importado diferente do de verdade.

const CABECALHO =
  'id,created_time,ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,form_id,form_name,is_organic,platform,selecione_a_unidade,full_name,email,phone_number,lead_status';

const linha = (extra: Record<string, string> = {}) => {
  const base: Record<string, string> = {
    id: 'l:111222333',
    created_time: '2026-03-14T18:22:10-03:00',
    ad_id: 'ag:900',
    ad_name: 'Anuncio 1',
    adset_id: 'as:800',
    adset_name: 'Conjunto Pinheiros',
    campaign_id: 'c:700',
    campaign_name: 'Campanha RH',
    form_id: 'f:600',
    form_name: '[Rise] forms | rh-instrutor',
    is_organic: 'false',
    platform: 'fb',
    selecione_a_unidade: 'Pinheiros',
    full_name: 'Maria Teste',
    email: 'maria@exemplo.com',
    phone_number: '+5511999999999',
    lead_status: 'CREATED',
    ...extra,
  };
  return CABECALHO.split(',').map((c) => base[c] ?? '').join(',');
};

describe('lerCsv', () => {
  it('lê aspas, vírgula e quebra de linha dentro de uma resposta', () => {
    const r = csv.lerCsv('a,b,c\r\n1,"dois, com vírgula","tres\ncom quebra"\r\n4,5,6\r\n');
    expect(r).toEqual([
      ['a', 'b', 'c'],
      ['1', 'dois, com vírgula', 'tres\ncom quebra'],
      ['4', '5', '6'],
    ]);
  });

  it('entende aspas duplas escapadas e ignora linhas em branco no fim', () => {
    expect(csv.lerCsv('a,b\n"diz ""oi""",x\n\n')).toEqual([['a', 'b'], ['diz "oi"', 'x']]);
  });

  it.each([
    ['tabulação', 'a\tb\n1\t2'],
    ['ponto e vírgula', 'a;b\n1;2'],
  ])('descobre o separador (%s)', (_nome, texto) => {
    expect(csv.lerCsv(texto)).toEqual([['a', 'b'], ['1', '2']]);
  });
});

describe('decodificar', () => {
  it('lê UTF-8 com BOM sem deixar o caractere invisível no primeiro campo', () => {
    const buf = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from('id,x\n1,2', 'utf8')]);
    expect(csv.decodificar(buf).startsWith('id,x')).toBe(true);
  });

  it('lê UTF-16 (o formato que o Meta usa em alguns downloads)', () => {
    const buf = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from('id\tnome\n1\tJosé', 'utf16le')]);
    expect(csv.decodificar(buf)).toBe('id\tnome\n1\tJosé');
  });
});

describe('normalizarId', () => {
  it.each([
    ['l:111222333', '111222333'],
    ['ag:900', '900'],
    ['f:600', '600'],
    ['111222333', '111222333'],
    ['  l:5 ', '5'],
  ])('%s → %s', (entrada, saida) => {
    expect(csv.normalizarId(entrada)).toBe(saida);
  });

  it.each([[''], ['   '], [undefined]])('vazio (%s) vira nulo', (entrada) => {
    expect(csv.normalizarId(entrada)).toBeNull();
  });
});

describe('paraHoraUtc', () => {
  it.each([
    ['2026-03-14T18:22:10-03:00', '2026-03-14T21:22:10+0000'],
    ['2026-03-14T21:22:10Z', '2026-03-14T21:22:10+0000'],
    ['2026-03-14T21:22:10+0000', '2026-03-14T21:22:10+0000'],
    // Sem fuso, assume São Paulo (UTC-3): é de onde vêm as planilhas da agência.
    ['2026-03-14 18:22:10', '2026-03-14T21:22:10+0000'],
    ['14/03/2026 18:22', '2026-03-14T21:22:00+0000'],
    ['14/03/2026 18:22:10', '2026-03-14T21:22:10+0000'],
    // Passa da meia-noite UTC: a data muda de dia.
    ['2026-03-14T22:30:00-03:00', '2026-03-15T01:30:00+0000'],
  ])('%s → %s', (entrada, saida) => {
    expect(csv.paraHoraUtc(entrada)).toBe(saida);
  });

  it.each([[''], ['ontem'], ['31/02/2026 10:00'], ['2026-13-40T10:00:00Z']])('rejeita %s', (entrada) => {
    expect(csv.paraHoraUtc(entrada)).toBeNull();
  });
});

describe('paraLeadBruto', () => {
  const [cab, dados] = csv.lerCsv(`${CABECALHO}\n${linha()}`);

  it('devolve o formato da Graph API: ids sem prefixo, hora em UTC', () => {
    const r = csv.paraLeadBruto(cab, dados, {});
    expect(r.ok).toBe(true);
    expect(r.lead).toMatchObject({
      id: '111222333',
      created_time: '2026-03-14T21:22:10+0000',
      ad_id: '900',
      adset_id: '800',
      campaign_id: '700',
      form_id: '600',
      adset_name: 'Conjunto Pinheiros',
      form_name: '[Rise] forms | rh-instrutor',
      platform: 'fb',
      is_organic: false,
    });
  });

  it('as perguntas do formulário viram field_data; status e metadados ficam de fora', () => {
    const { lead } = csv.paraLeadBruto(cab, dados, {});
    const nomes = lead.field_data.map((c: { name: string }) => c.name);
    expect(nomes).toEqual(['selecione_a_unidade', 'full_name', 'email', 'phone_number']);
    expect(nomes).not.toContain('lead_status');
    expect(lead.field_data[0]).toEqual({ name: 'selecione_a_unidade', values: ['Pinheiros'] });
  });

  it('o app lê o lead importado como leria o da API', () => {
    const { lead } = csv.paraLeadBruto(cab, dados, {});
    const l = normalizarLead(lead);
    expect(l.nome).toBe('Maria Teste');
    expect(l.email).toBe('maria@exemplo.com');
    expect(l.telefone).toBe('+5511999999999');
    expect(l.unidadeEscolhida).toBe('Pinheiros');
    expect(l.criadoEm).toBe('2026-03-14T21:22:10+0000');
  });

  it('is_organic entende sim/não, true/false e 1/0', () => {
    const lerOrg = (v: string) => {
      const [c, d] = csv.lerCsv(`${CABECALHO}\n${linha({ is_organic: v })}`);
      return csv.paraLeadBruto(c, d, {}).lead.is_organic;
    };
    expect([lerOrg('true'), lerOrg('Sim'), lerOrg('1'), lerOrg('false'), lerOrg('Não'), lerOrg('')]).toEqual([
      true, true, true, false, false, false,
    ]);
  });

  it('sem id: recusa e diz o motivo, em vez de inventar', () => {
    const [c, d] = csv.lerCsv(`${CABECALHO}\n${linha({ id: '' })}`);
    const r = csv.paraLeadBruto(c, d, {});
    expect(r.ok).toBe(false);
    expect(r.motivo).toMatch(/sem id/i);
  });

  it('com gerarId, cria um id estável (o mesmo lead sempre dá o mesmo id)', () => {
    const [c, d] = csv.lerCsv(`${CABECALHO}\n${linha({ id: '' })}`);
    const a = csv.paraLeadBruto(c, d, { gerarId: true });
    const b = csv.paraLeadBruto(c, d, { gerarId: true });
    expect(a.ok).toBe(true);
    expect(a.lead.id).toMatch(/^csv-[0-9a-f]{16}$/);
    expect(a.lead.id).toBe(b.lead.id);
  });

  it('data ilegível: recusa e diz o motivo', () => {
    const [c, d] = csv.lerCsv(`${CABECALHO}\n${linha({ created_time: 'ontem' })}`);
    const r = csv.paraLeadBruto(c, d, {});
    expect(r.ok).toBe(false);
    expect(r.motivo).toMatch(/data/i);
  });
});

describe('importarCsv', () => {
  const texto = [
    CABECALHO,
    linha({ id: 'l:1', created_time: '2026-03-14T18:00:00-03:00' }),
    linha({ id: 'l:2', created_time: '2026-04-02T09:00:00-03:00' }),
    linha({ id: 'l:2', created_time: '2026-04-02T09:00:00-03:00' }), // repetido no arquivo
    linha({ id: '', created_time: '2026-05-01T09:00:00-03:00' }),    // sem id
    linha({ id: 'l:4', created_time: 'ontem' }),                      // data ruim
  ].join('\n');

  it('conta o que entrou, o que repetiu e o que foi recusado, com o número da linha', () => {
    const r = csv.importarCsv(texto, {});
    expect(r.leads.map((l: { id: string }) => l.id)).toEqual(['2', '1']);
    expect(r.repetidos).toBe(1);
    expect(r.rejeitadas).toHaveLength(2);
    expect(r.rejeitadas.map((x: { linha: number }) => x.linha)).toEqual([5, 6]);
    expect(r.periodo).toEqual({ de: '2026-03-14', ate: '2026-04-02' });
  });

  it('falta de coluna essencial é erro do arquivo, não de cada linha', () => {
    expect(() => csv.importarCsv('nome,email\nAna,a@b.com', {})).toThrow(/created_time|data/i);
  });

  it('gerarId pula as linhas que o Meta ainda entrega (evita duplicar o que a API já traz)', () => {
    const r = csv.importarCsv(
      [CABECALHO, linha({ id: '', created_time: '2026-03-14T18:00:00-03:00' }), linha({ id: '', created_time: '2026-09-01T10:00:00-03:00', email: 'b@b.com' })].join('\n'),
      { gerarId: true, apenasAntesDe: '2026-07-07T00:00:00+0000' },
    );
    expect(r.leads).toHaveLength(1);
    expect(r.pulados).toBe(1);
  });

  it('o resultado entra na mescla sem duplicar o que já existe com o mesmo id', () => {
    const importados = csv.importarCsv(texto, {}).leads;
    const existentes = [{ id: '2', created_time: '2026-04-02T12:00:00+0000', form_name: 'guardado' }];
    const m = mesclarLeads(existentes, importados);
    expect(m.leads).toHaveLength(2);
    expect(m.atualizados).toBe(1);
  });
});

describe('paraLinhaDoBanco', () => {
  it('preenche as colunas da tabela como a função de sincronização preenche', () => {
    const [c, d] = csv.lerCsv(`${CABECALHO}\n${linha()}`);
    const { lead } = csv.paraLeadBruto(c, d, {});
    const l = csv.paraLinhaDoBanco(lead, '2026-10-06T12:00:00.000Z');
    expect(l).toMatchObject({
      id: '111222333',
      criado_em: '2026-03-14T21:22:10+0000',
      nome: 'Maria Teste',
      email: 'maria@exemplo.com',
      telefone: '+5511999999999',
      unidade_escolhida: 'Pinheiros',
      eh_teste: false,
      is_organic: false,
      form_name: '[Rise] forms | rh-instrutor',
      sincronizado_em: '2026-10-06T12:00:00.000Z',
    });
    expect(l.field_data).toHaveLength(4);
  });

  it('marca lead de teste do Meta', () => {
    const [c, d] = csv.lerCsv(`${CABECALHO}\n${linha({ full_name: '<test lead: dummy data for full_name>' })}`);
    const { lead } = csv.paraLeadBruto(c, d, {});
    expect(csv.paraLinhaDoBanco(lead, 'x').eh_teste).toBe(true);
  });
});
