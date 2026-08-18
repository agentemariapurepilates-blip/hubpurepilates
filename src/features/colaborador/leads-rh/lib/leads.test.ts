import { describe, expect, it } from 'vitest';
import {
  agruparPorConjunto,
  contarDistintos,
  filtrarLeads,
  normalizarLead,
  rotuloDaPergunta,
  SEM_CONJUNTO,
  type LeadBruto,
} from './leads';

// O formato abaixo é o que a Graph API devolveu de verdade em 18/08/2026 para
// o formulário `[Rise] forms | rh-instrutor-penha`. Trocar por um exemplo
// inventado tiraria o valor do teste: o que precisa ser garantido é que o
// parser aguenta o que chega, inclusive o nome de campo com "?" no fim.
const bruto = (mudancas: Partial<LeadBruto> = {}): LeadBruto => ({
  id: '1729631231675849',
  created_time: '2026-08-11T19:50:20+0000',
  ad_id: '52585766750159',
  ad_name: 'instrutor-pilates | penha | motion-08/26',
  adset_id: '52585766750359',
  adset_name: 'penha | sao-paulo | cargos | instrutor-pilates',
  campaign_id: '6895400566555',
  campaign_name: '[Rise] lead-ad | always-on | rh-instrutor',
  form_id: '3417462551791012',
  form_name: '[Rise] forms | rh-instrutor-penha',
  platform: 'fb',
  is_organic: false,
  field_data: [
    { name: 'o_que_te_faz_procurar_o_pilates?', values: ['Quero trabalhar com movimento'] },
    { name: 'selecione_a_unidade', values: ['Penha'] },
    { name: 'full_name', values: ['Maria Souza'] },
    { name: 'email', values: ['maria@exemplo.com'] },
    { name: 'phone_number', values: ['+55 11 99999 0001'] },
  ],
  ...mudancas,
});

describe('normalizarLead', () => {
  it('separa os campos de contato do resto do formulário', () => {
    const lead = normalizarLead(bruto());
    expect(lead.nome).toBe('Maria Souza');
    expect(lead.email).toBe('maria@exemplo.com');
    expect(lead.unidadeEscolhida).toBe('Penha');
    // O que não é contato vira resposta, com a pergunta legível.
    expect(lead.respostas).toEqual([
      { pergunta: 'O que te faz procurar o pilates?', resposta: 'Quero trabalhar com movimento' },
    ]);
  });

  it('tira os espaços do telefone e mantém o DDI', () => {
    // Quem usa a lista disca ou cola no WhatsApp; os dois querem o +55.
    expect(normalizarLead(bruto()).telefone).toBe('+5511999990001');
  });

  it('lê a unidade a partir do nome do conjunto', () => {
    expect(normalizarLead(bruto()).unidadeDoConjunto).toBe('penha');
  });

  it('guarda as duas unidades, porque elas podem divergir', () => {
    // O anúncio saiu pela Penha e a pessoa escolheu Tatuapé. Sobrescrever uma
    // com a outra esconderia que o candidato quer outra unidade.
    const lead = normalizarLead(
      bruto({
        field_data: [
          { name: 'full_name', values: ['João'] },
          { name: 'selecione_a_unidade', values: ['Tatuapé'] },
        ],
      }),
    );
    expect(lead.unidadeDoConjunto).toBe('penha');
    expect(lead.unidadeEscolhida).toBe('Tatuapé');
  });

  it('marca o lead de teste do Meta', () => {
    const teste = normalizarLead(
      bruto({
        field_data: [
          { name: 'full_name', values: ['<test lead: dummy data for full_name>'] },
        ],
      }),
    );
    expect(teste.ehTeste).toBe(true);
    expect(normalizarLead(bruto()).ehTeste).toBe(false);
  });

  it('aguenta lead orgânico, que não tem conjunto nenhum', () => {
    const lead = normalizarLead(
      bruto({ adset_id: null, adset_name: null, ad_name: null, is_organic: true }),
    );
    expect(lead.organico).toBe(true);
    expect(lead.conjuntoNome).toBeNull();
    expect(lead.unidadeDoConjunto).toBeNull();
  });

  it('não quebra com formulário sem campo nenhum', () => {
    const lead = normalizarLead(bruto({ field_data: null }));
    expect(lead.nome).toBeNull();
    expect(lead.respostas).toEqual([]);
    expect(lead.ehTeste).toBe(false);
  });

  it('reconhece o campo mesmo com acento e caixa diferentes', () => {
    const lead = normalizarLead(
      bruto({ field_data: [{ name: 'E-Mail', values: ['a@b.com'] }] }),
    );
    expect(lead.email).toBe('a@b.com');
    // E não pode duplicar como resposta livre.
    expect(lead.respostas).toEqual([]);
  });

  it('trata valor em branco como ausente', () => {
    const lead = normalizarLead(
      bruto({ field_data: [{ name: 'full_name', values: ['   '] }] }),
    );
    expect(lead.nome).toBeNull();
  });
});

describe('rotuloDaPergunta', () => {
  it('troca separadores por espaço e sobe a primeira letra', () => {
    expect(rotuloDaPergunta('nome_completo')).toBe('Nome completo');
    expect(rotuloDaPergunta('o_que_te_faz_procurar_o_pilates?')).toBe(
      'O que te faz procurar o pilates?',
    );
  });
});

describe('agruparPorConjunto', () => {
  const leadsDe = (specs: Array<Partial<LeadBruto>>) => specs.map((s) => normalizarLead(bruto(s)));

  it('separa por conjunto e ordena do maior para o menor', () => {
    const grupos = agruparPorConjunto(
      leadsDe([
        { id: '1' },
        { id: '2' },
        { id: '3', adset_id: 'b', adset_name: 'tatuape | sao-paulo | cargos | instrutor-pilates' },
      ]),
    );
    expect(grupos).toHaveLength(2);
    expect(grupos[0].leads).toHaveLength(2);
    expect(grupos[0].unidade).toBe('penha');
    expect(grupos[1].unidade).toBe('tatuape');
  });

  it('põe o lead sem conjunto num grupo próprio, em vez de descartar', () => {
    // O formulário fica aberto na página: quem chega por lá é candidato de
    // verdade e não pode sumir da lista do RH.
    const grupos = agruparPorConjunto(
      leadsDe([{ id: '1' }, { id: '2', adset_id: null, adset_name: null, is_organic: true }]),
    );
    expect(grupos.map((g) => g.conjuntoNome)).toContain(SEM_CONJUNTO);
  });

  it('ordena os leads de cada grupo do mais novo para o mais antigo', () => {
    const grupos = agruparPorConjunto(
      leadsDe([
        { id: 'velho', created_time: '2026-08-01T10:00:00+0000' },
        { id: 'novo', created_time: '2026-08-15T10:00:00+0000' },
      ]),
    );
    expect(grupos[0].leads.map((l) => l.id)).toEqual(['novo', 'velho']);
  });

  it('conta pessoas distintas, e não linhas', () => {
    const mesmaPessoa = { name: 'email', values: ['ana@exemplo.com'] };
    const grupos = agruparPorConjunto(
      leadsDe([
        { id: '1', field_data: [mesmaPessoa] },
        { id: '2', field_data: [mesmaPessoa] },
        { id: '3', field_data: [{ name: 'email', values: ['outra@exemplo.com'] }] },
      ]),
    );
    expect(grupos[0].leads).toHaveLength(3);
    expect(grupos[0].distintos).toBe(2);
  });
});

describe('contarDistintos', () => {
  const comEmail = (email: string | null, telefone?: string) =>
    normalizarLead(
      bruto({
        id: Math.random().toString(),
        field_data: [
          ...(email ? [{ name: 'email', values: [email] }] : []),
          ...(telefone ? [{ name: 'phone_number', values: [telefone] }] : []),
        ],
      }),
    );

  it('ignora diferença de caixa no e-mail', () => {
    expect(contarDistintos([comEmail('Ana@Exemplo.com'), comEmail('ana@exemplo.com')])).toBe(1);
  });

  it('cai no telefone quando não há e-mail', () => {
    expect(contarDistintos([comEmail(null, '+5511999990001'), comEmail(null, '+5511999990001')])).toBe(1);
  });

  it('sem e-mail nem telefone, cada lead conta por si', () => {
    // Juntar todos num só esconderia candidatos; separar no máximo repete um.
    expect(contarDistintos([comEmail(null), comEmail(null)])).toBe(2);
  });
});

describe('filtrarLeads', () => {
  const lista = [
    normalizarLead(bruto({ id: 'a' })),
    normalizarLead(
      bruto({
        id: 'b',
        created_time: '2026-07-02T10:00:00+0000',
        adset_name: 'tatuape | sao-paulo | cargos | instrutor-pilates',
        field_data: [
          { name: 'full_name', values: ['Carlos Lima'] },
          { name: 'email', values: ['carlos@exemplo.com'] },
        ],
      }),
    ),
    normalizarLead(
      bruto({ id: 'teste', field_data: [{ name: 'full_name', values: ['<test lead: dummy>'] }] }),
    ),
  ];

  it('esconde o lead de teste por padrão', () => {
    // Ele entraria na planilha que o RH usa para ligar.
    expect(filtrarLeads(lista, {}).map((l) => l.id)).toEqual(['a', 'b']);
    expect(filtrarLeads(lista, { incluirTestes: true })).toHaveLength(3);
  });

  it('busca por nome, e-mail e unidade sem se importar com acento', () => {
    expect(filtrarLeads(lista, { busca: 'carlos' }).map((l) => l.id)).toEqual(['b']);
    expect(filtrarLeads(lista, { busca: 'TATUAPE' }).map((l) => l.id)).toEqual(['b']);
  });

  it('filtra por conjunto', () => {
    const so = filtrarLeads(lista, {
      conjuntoNome: 'penha | sao-paulo | cargos | instrutor-pilates',
    });
    expect(so.map((l) => l.id)).toEqual(['a']);
  });

  it('filtra por período, com as duas pontas incluídas', () => {
    expect(filtrarLeads(lista, { de: '2026-08-01' }).map((l) => l.id)).toEqual(['a']);
    expect(filtrarLeads(lista, { ate: '2026-07-31' }).map((l) => l.id)).toEqual(['b']);
    expect(filtrarLeads(lista, { de: '2026-07-02', ate: '2026-07-02' }).map((l) => l.id)).toEqual(['b']);
  });
});
