import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import {
  dataBr,
  horaBr,
  linhaDoLead,
  montarPlanilha,
  montarPlanilhaDoConjunto,
  nomeDeAba,
  nomeDeArquivo,
  perguntasDe,
} from './planilha';
import { normalizarLead, type LeadBruto } from './leads';

const bruto = (mudancas: Partial<LeadBruto> = {}): LeadBruto => ({
  id: '1',
  created_time: '2026-08-11T19:50:20+0000',
  ad_name: 'instrutor-pilates | penha | motion-08/26',
  adset_id: 'a',
  adset_name: 'penha | sao-paulo | cargos | instrutor-pilates',
  campaign_name: '[Rise] lead-ad | always-on | rh-instrutor',
  form_name: '[Rise] forms | rh-instrutor-penha',
  platform: 'fb',
  is_organic: false,
  field_data: [
    { name: 'full_name', values: ['Maria Souza'] },
    { name: 'email', values: ['maria@exemplo.com'] },
    { name: 'phone_number', values: ['+5511999990001'] },
    { name: 'selecione_a_unidade', values: ['Penha'] },
  ],
  ...mudancas,
});

describe('dataBr e horaBr', () => {
  it('formata sem deixar o fuso mudar o dia', () => {
    // `new Date('2026-08-11T19:50:20+0000')` vira 11/08 16:50 em Brasília. O
    // que a planilha precisa mostrar é o instante como o Meta registrou.
    expect(dataBr('2026-08-11T19:50:20+0000')).toBe('11/08/2026');
    expect(horaBr('2026-08-11T19:50:20+0000')).toBe('19:50');
  });

  it('devolve a entrada quando não é data', () => {
    expect(dataBr('sem data')).toBe('sem data');
  });
});

describe('nomeDeAba', () => {
  it('troca os caracteres que o Excel proíbe', () => {
    // Sem isso o arquivo abre corrompido, e o erro do Excel não diz o motivo.
    expect(nomeDeAba('sao-bernardo/nova-petropolis', new Set())).toBe('sao-bernardo-nova-petropolis');
  });

  it('respeita o limite de 31 caracteres', () => {
    const longo = 'sao-bernardo-do-campo-nova-petropolis-centro';
    expect(nomeDeAba(longo, new Set()).length).toBeLessThanOrEqual(31);
  });

  it('não repete nome quando o corte gera colisão', () => {
    const usados = new Set<string>();
    const a = nomeDeAba('unidade-com-nome-muito-comprido-um', usados);
    const b = nomeDeAba('unidade-com-nome-muito-comprido-dois', usados);
    expect(a).not.toBe(b);
    expect(b.length).toBeLessThanOrEqual(31);
  });

  it('não devolve nome vazio', () => {
    expect(nomeDeAba('   ', new Set())).toBe('Sem nome');
  });
});

describe('perguntasDe', () => {
  it('junta as perguntas de formulários diferentes, sem repetir', () => {
    // Um formulário novo pode acrescentar pergunta a qualquer momento; fixar as
    // colunas no código faria a resposta nova sumir sem ninguém perceber.
    const leads = [
      normalizarLead(bruto({ field_data: [{ name: 'por_que_pilates', values: ['a'] }] })),
      normalizarLead(bruto({ field_data: [{ name: 'tem_experiencia', values: ['b'] }] })),
      normalizarLead(bruto({ field_data: [{ name: 'por_que_pilates', values: ['c'] }] })),
    ];
    expect(perguntasDe(leads)).toEqual(['Por que pilates', 'Tem experiencia']);
  });
});

describe('linhaDoLead', () => {
  it('preenche as colunas fixas', () => {
    const linha = linhaDoLead(normalizarLead(bruto()), []);
    expect(linha).toMatchObject({
      Data: '11/08/2026',
      Nome: 'Maria Souza',
      'E-mail': 'maria@exemplo.com',
      Telefone: '+5511999990001',
      'Unidade escolhida': 'Penha',
      'Unidade do conjunto': 'penha',
      Origem: 'anúncio',
    });
  });

  it('marca o lead orgânico na coluna de origem', () => {
    const linha = linhaDoLead(
      normalizarLead(bruto({ is_organic: true, adset_name: null })),
      [],
    );
    expect(linha.Origem).toBe('orgânico');
  });

  it('deixa em branco a pergunta que o lead não respondeu', () => {
    // String vazia, e não `undefined`: o `xlsx` pula a célula ausente e as
    // colunas seguintes sobem uma casa na linha.
    const linha = linhaDoLead(normalizarLead(bruto()), ['Pergunta que ninguém respondeu']);
    expect(linha['Pergunta que ninguém respondeu']).toBe('');
  });
});

describe('montarPlanilha', () => {
  const leads = [
    normalizarLead(bruto({ id: '1' })),
    normalizarLead(bruto({ id: '2' })),
    normalizarLead(
      bruto({
        id: '3',
        adset_id: 'b',
        adset_name: 'tatuape | sao-paulo | cargos | instrutor-pilates',
      }),
    ),
    normalizarLead(bruto({ id: '4', adset_id: null, adset_name: null, is_organic: true })),
  ];

  it('abre com a aba de todos e depois uma por conjunto', () => {
    const livro = montarPlanilha(leads);
    expect(livro.SheetNames[0]).toBe('Todos os leads');
    expect(livro.SheetNames).toContain('penha');
    expect(livro.SheetNames).toContain('tatuape');
    // O grupo sem conjunto também vira aba — o candidato orgânico é real.
    expect(livro.SheetNames).toHaveLength(4);
  });

  it('a aba de todos tem uma linha por lead', () => {
    const livro = montarPlanilha(leads);
    const linhas = XLSX.utils.sheet_to_json(livro.Sheets['Todos os leads']);
    expect(linhas).toHaveLength(4);
  });

  it('cada aba de conjunto leva só os leads dele', () => {
    const livro = montarPlanilha(leads);
    expect(XLSX.utils.sheet_to_json(livro.Sheets['penha'])).toHaveLength(2);
    expect(XLSX.utils.sheet_to_json(livro.Sheets['tatuape'])).toHaveLength(1);
  });

  it('nenhum nome de aba passa de 31 caracteres', () => {
    const longos = [
      normalizarLead(
        bruto({
          adset_name:
            'sao-bernardo-do-campo/nova-petropolis | sao-paulo | cargos | instrutor-pilates',
        }),
      ),
      normalizarLead(
        bruto({
          id: '9',
          adset_id: 'z',
          adset_name: 'rio-de-janeiro/barra-itauna-shopping | rio-de-janeiro | cargos | instrutor-pilates',
        }),
      ),
    ];
    const livro = montarPlanilha(longos);
    for (const nome of livro.SheetNames) {
      expect(nome.length, nome).toBeLessThanOrEqual(31);
      expect(nome, nome).not.toMatch(/[\\/?*[\]:]/);
    }
    expect(new Set(livro.SheetNames).size).toBe(livro.SheetNames.length);
  });

  it('sobrevive a uma lista vazia', () => {
    const livro = montarPlanilha([]);
    expect(livro.SheetNames).toEqual(['Todos os leads']);
  });

  it('o arquivo gerado pode ser lido de volta', () => {
    // A garantia de que o XLSX não sai corrompido.
    const buffer = XLSX.write(montarPlanilha(leads), { type: 'buffer', bookType: 'xlsx' });
    const relido = XLSX.read(buffer, { type: 'buffer' });
    expect(relido.SheetNames).toContain('penha');
    const linhas = XLSX.utils.sheet_to_json<Record<string, string>>(
      relido.Sheets['Todos os leads'],
    );
    expect(linhas[0].Nome).toBe('Maria Souza');
  });
});
describe('download de um conjunto só', () => {
  const leads = [
    normalizarLead(bruto({ id: '1' })),
    normalizarLead(bruto({ id: '2' })),
  ];

  it('gera uma aba só, sem repetir a de "todos"', () => {
    // Com um conjunto apenas, "Todos os leads" e a aba da unidade teriam
    // exatamente as mesmas linhas — duas abas iguais fazem quem abre procurar
    // a diferença que não existe.
    const livro = montarPlanilhaDoConjunto(leads, 'penha');
    expect(livro.SheetNames).toEqual(['penha']);
    expect(XLSX.utils.sheet_to_json(livro.Sheets['penha'])).toHaveLength(2);
  });

  it('a aba respeita o limite e os caracteres proibidos do Excel', () => {
    const livro = montarPlanilhaDoConjunto(leads, 'sao-bernardo-do-campo/nova-petropolis-centro');
    const [nome] = livro.SheetNames;
    expect(nome.length).toBeLessThanOrEqual(31);
    expect(nome).not.toMatch(/[\/?*[]:]/);
  });

  it('o nome do arquivo não pode ter barra', () => {
    // `jacarei/boulevard` viraria caminho de pasta: o navegador trataria o
    // pedaço antes da barra como diretório e o download sairia truncado.
    expect(nomeDeArquivo('jacarei/boulevard')).toBe('jacarei-boulevard');
    expect(nomeDeArquivo('sao paulo: centro')).toBe('sao-paulo-centro');
  });

  it('o arquivo gerado pode ser lido de volta', () => {
    const buffer = XLSX.write(montarPlanilhaDoConjunto(leads, 'penha'), {
      type: 'buffer',
      bookType: 'xlsx',
    });
    const relido = XLSX.read(buffer, { type: 'buffer' });
    const linhas = XLSX.utils.sheet_to_json<Record<string, string>>(relido.Sheets['penha']);
    expect(linhas[0].Nome).toBe('Maria Souza');
  });
});
