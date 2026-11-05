import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  CRIATIVOS,
  OBJETIVOS,
  PRODUTOS,
  copiaParaAncine,
  corpoDoWebhook,
  destinatariosDoEmail,
  formatarCep,
  formatarCnpj,
  formatarTelefone,
  validarCnpj,
  validarPedido,
} from '../../../../supabase/functions/send-midia-local/pedido';

// O pedido de mídia local vai para a Rise por e-mail e vira cobrança na Globo
// (CNPJ, razão social, endereço de cobrança). Dado errado aqui custa um
// vai-e-volta entre franqueado, Rise e Globo, então a validação é rígida onde
// há regra objetiva (CNPJ, CEP, datas) e solta onde o texto é livre.

const valido = {
  nome_franqueado: '  Ana Souza ',
  email_franqueado: 'ana@exemplo.com',
  telefone: '(11) 99999-1234',
  nome_unidade: 'Pure Pilates Moema',
  endereco_unidade: 'Av. Ibirapuera, 2000 - Moema, São Paulo/SP',
  cep: '04029-200',
  objetivo: 'reforco',
  data_inauguracao: '',
  periodo_inicio: '2026-12-01',
  periodo_fim: '2026-12-15',
  cnpj: '11.222.333/0001-81',
  razao_social: 'Moema Pilates Ltda',
  endereco_cobranca: 'Rua das Flores, 10 - Centro, São Paulo/SP, CEP 01000-000',
  criativo_tipo: 'cartela',
  criativo_info: 'Texto: Aula experimental grátis. Foto da fachada.',
  produtos: ['tv'],
};

describe('validarPedido', () => {
  it('aceita um pedido correto e normaliza os campos', () => {
    const r = validarPedido(valido);
    expect(r.ok).toBe(true);
    expect(r.ok && r.pedido).toMatchObject({
      nome_franqueado: 'Ana Souza',
      telefone: '11999991234',
      cep: '04029-200',
      cnpj: '11.222.333/0001-81',
      objetivo: 'reforco',
      data_inauguracao: null,
      produtos: ['tv'],
    });
  });

  it('inauguração exige a data; reforço ignora uma data que sobrou', () => {
    expect(validarPedido({ ...valido, objetivo: 'inauguracao', data_inauguracao: '' }).ok).toBe(false);
    expect(validarPedido({ ...valido, objetivo: 'inauguracao', data_inauguracao: '2027-01-10' }).ok).toBe(true);
    const r = validarPedido({ ...valido, objetivo: 'reforco', data_inauguracao: '2027-01-10' });
    expect(r.ok && r.pedido.data_inauguracao).toBeNull();
  });

  it.each([
    ['sem nome do franqueado', { nome_franqueado: ' ' }],
    ['sem unidade', { nome_unidade: '' }],
    ['sem endereço da unidade', { endereco_unidade: '' }],
    ['CEP curto', { cep: '0402920' }],
    ['CEP com letra', { cep: '04029-2OO' }],
    ['objetivo fora da lista', { objetivo: 'outro' }],
    ['período sem início', { periodo_inicio: '' }],
    ['período com fim antes do início', { periodo_inicio: '2026-12-15', periodo_fim: '2026-12-01' }],
    ['data que não existe no período', { periodo_fim: '2026-02-30' }],
    ['CNPJ com dígito errado', { cnpj: '11.222.333/0001-82' }],
    ['CNPJ de dígitos repetidos', { cnpj: '11.111.111/1111-11' }],
    ['CNPJ curto', { cnpj: '11.222.333/0001' }],
    ['sem razão social', { razao_social: '' }],
    ['sem endereço de cobrança', { endereco_cobranca: '' }],
    ['criativo fora da lista', { criativo_tipo: 'video' }],
    ['sem informações do criativo', { criativo_info: '  ' }],
    ['nenhum produto marcado', { produtos: [] }],
    ['produto que não existe', { produtos: ['tv', 'radio'] }],
    ['produtos que não é lista', { produtos: 'tv' }],
    ['e-mail do franqueado inválido', { email_franqueado: 'ana@' }],
    ['telefone sem DDD', { telefone: '99999-1234' }],
    ['telefone com poucos dígitos', { telefone: '(11) 9999' }],
    ['nome enorme', { nome_unidade: 'x'.repeat(201) }],
  ])('recusa %s', (_nome, troca) => {
    expect(validarPedido({ ...valido, ...troca }).ok).toBe(false);
  });

  it('a mensagem de erro diz qual campo está errado', () => {
    const r = validarPedido({ ...valido, cnpj: '11.222.333/0001-82' });
    expect(r.ok === false && r.erro).toMatch(/cnpj/i);
  });

  it('aceita mais de um produto, sem repetir, na ordem do formulário', () => {
    const r = validarPedido({ ...valido, produtos: ['near_live', 'tv', 'near_live'] });
    expect(r.ok && r.pedido.produtos).toEqual(['tv', 'near_live']);
  });

  it('não deixa escolher o status nem o dono do pedido', () => {
    const r = validarPedido({ ...valido, status: 'atendido', user_id: 'outro' });
    expect(r.ok && Object.keys(r.pedido)).not.toContain('status');
    expect(r.ok && Object.keys(r.pedido)).not.toContain('user_id');
  });
});

describe('CNPJ', () => {
  it.each([
    ['11.222.333/0001-81', '11.222.333/0001-81'],
    ['11222333000181', '11.222.333/0001-81'],
    ['11.444.777/0001-61', '11.444.777/0001-61'],
    // CNPJ alfanumérico, emitido pela Receita a partir de julho/2026. Exemplo
    // oficial da nota técnica. Uma loja nova pode já nascer com um destes.
    ['12.ABC.345/01DE-35', '12.ABC.345/01DE-35'],
    ['12abc34501de35', '12.ABC.345/01DE-35'],
  ])('aceita %s', (entrada, formatado) => {
    expect(validarCnpj(entrada)).toBe(formatado);
  });

  it.each([['12.ABC.345/01DE-36'], ['12.ABC.345/01DE-3X'], ['00.000.000/0000-00'], [''], ['abc']])(
    'recusa %s',
    (entrada) => {
      expect(validarCnpj(entrada)).toBeNull();
    },
  );
});

describe('formatação', () => {
  it('CEP', () => {
    expect(formatarCep('04029200')).toBe('04029-200');
  });

  it.each([
    ['11999991234', '(11) 99999-1234'],
    ['1133334444', '(11) 3333-4444'],
  ])('telefone %s', (digitos, texto) => {
    expect(formatarTelefone(digitos)).toBe(texto);
  });

  it('CNPJ', () => {
    expect(formatarCnpj('11222333000181')).toBe('11.222.333/0001-81');
  });

  it('telefone com +55 e símbolos vira só DDD + número', () => {
    const r = validarPedido({ ...valido, telefone: '+55 (11) 99999-1234' });
    expect(r.ok && r.pedido.telefone).toBe('11999991234');
  });
});

describe('destinatariosDoEmail', () => {
  it('limpa espaços, descarta inválidos e repetidos (sem diferenciar maiúsculas)', () => {
    expect(
      destinatariosDoEmail([{ email: ' rh@x.com ' }, { email: 'RH@x.com' }, { email: 'invalido' }, { email: null }, { email: 'b@x.com' }]),
    ).toEqual(['rh@x.com', 'b@x.com']);
  });
});

describe('copiaParaAncine', () => {
  const pedido = (criativo_tipo: string) => {
    const r = validarPedido({ ...valido, criativo_tipo });
    if (!r.ok) throw new Error(r.erro);
    return r.pedido;
  };

  it('só tem cópia quando o criativo é adaptação de campanha (custo de Ancine)', () => {
    expect(copiaParaAncine(pedido('cartela'), 'mkt@pure.com')).toEqual([]);
    expect(copiaParaAncine(pedido('adaptacao'), 'mkt@pure.com')).toEqual(['mkt@pure.com']);
  });

  it('sem endereço configurado, não há cópia (e não quebra)', () => {
    expect(copiaParaAncine(pedido('adaptacao'), undefined)).toEqual([]);
    expect(copiaParaAncine(pedido('adaptacao'), '  ')).toEqual([]);
  });

  it('aceita vários endereços separados por vírgula e descarta o inválido', () => {
    expect(copiaParaAncine(pedido('adaptacao'), 'a@x.com, b@x.com, lixo')).toEqual(['a@x.com', 'b@x.com']);
  });
});

describe('corpoDoWebhook', () => {
  const montar = (troca: Record<string, unknown> = {}, cc: string[] = []) => {
    const r = validarPedido({ ...valido, ...troca });
    if (!r.ok) throw new Error(r.erro);
    return corpoDoWebhook('abc', r.pedido, 'ana@exemplo.com', ['rise@x.com'], cc);
  };

  // O e-mail é montado no n8n com estes campos. Se um sumir daqui, o e-mail da
  // Rise chega com buraco — e a Rise responde direto ao franqueado, então o
  // telefone e o e-mail dele têm que estar lá.
  it('leva tudo que a Rise precisa, já formatado', () => {
    expect(montar()).toEqual({
      id: 'abc',
      tipo: 'midia_local',
      nome_franqueado: 'Ana Souza',
      email_franqueado: 'ana@exemplo.com',
      telefone_fmt: '(11) 99999-1234',
      nome_unidade: 'Pure Pilates Moema',
      endereco_unidade: 'Av. Ibirapuera, 2000 - Moema, São Paulo/SP',
      cep: '04029-200',
      objetivo_label: 'Reforço de marketing local',
      data_inauguracao_fmt: '',
      periodo_fmt: '01/12/2026 a 15/12/2026',
      cnpj: '11.222.333/0001-81',
      razao_social: 'Moema Pilates Ltda',
      endereco_cobranca: 'Rua das Flores, 10 - Centro, São Paulo/SP, CEP 01000-000',
      criativo_label: 'Cartela com texto e foto (modelo DCO, sem custo de Ancine)',
      ancine: false,
      criativo_info: 'Texto: Aula experimental grátis. Foto da fachada.',
      produtos_texto: 'Só TV Globo',
      submitted_by: 'ana@exemplo.com',
      responder_para: 'ana@exemplo.com',
      destinatarios: ['rise@x.com'],
      cc: [],
    });
  });

  it('inauguração mostra a data no e-mail', () => {
    const c = montar({ objetivo: 'inauguracao', data_inauguracao: '2027-01-10' });
    expect(c.objetivo_label).toBe('Inauguração prevista (loja nova)');
    expect(c.data_inauguracao_fmt).toBe('10/01/2027');
  });

  it('adaptação de campanha marca Ancine e leva a cópia', () => {
    const c = montar({ criativo_tipo: 'adaptacao' }, ['mkt@pure.com']);
    expect(c.ancine).toBe(true);
    expect(c.criativo_label).toMatch(/Ancine/);
    expect(c.cc).toEqual(['mkt@pure.com']);
  });

  it('vários produtos viram um texto só, na ordem do formulário', () => {
    const c = montar({ produtos: ['tv_gama', 'tv_digital', 'tv'] });
    expect(c.produtos_texto).toBe('Só TV Globo · TV mais digital · TV Globo com as telas da GAMA');
  });

  it('a Rise responde ao franqueado: responder_para é o e-mail dele', () => {
    expect(montar({ email_franqueado: 'outro@exemplo.com' }).responder_para).toBe('outro@exemplo.com');
  });
});

// A validação do app e as travas (CHECK) da tabela precisam concordar. Se o app
// aceitar algo que o banco recusa, o franqueado preenche tudo e leva um erro
// genérico no fim. Aqui os padrões saem do próprio arquivo da migration.
describe('travas do banco concordam com a validação', () => {
  const sql = readFileSync('supabase/migrations/20261104180000_midia_local.sql', 'utf8');
  const padrao = (coluna: string) => {
    const achado = new RegExp(`${coluna}\\s+text NOT NULL CHECK \\(${coluna} ~ '([^']+)'\\)`).exec(sql);
    if (!achado) throw new Error(`padrão de ${coluna} não encontrado na migration`);
    return new RegExp(achado[1]);
  };

  const gerar = (troca: Record<string, unknown>) => {
    const r = validarPedido({ ...valido, ...troca });
    if (!r.ok) throw new Error(r.erro);
    return r.pedido;
  };

  it.each([['11.222.333/0001-81'], ['12.ABC.345/01DE-35']])('o CNPJ %s passa no CHECK da tabela', (cnpj) => {
    expect(padrao('cnpj').test(gerar({ cnpj }).cnpj)).toBe(true);
  });

  it.each([['(11) 99999-1234'], ['(11) 3333-4444'], ['+55 21 98888-7777']])('o telefone %s passa no CHECK', (telefone) => {
    expect(padrao('telefone').test(gerar({ telefone }).telefone)).toBe(true);
  });

  it('o CEP passa no CHECK, com ou sem hífen digitado', () => {
    expect(padrao('cep').test(gerar({ cep: '04029200' }).cep)).toBe(true);
    expect(padrao('cep').test(gerar({ cep: '04029-200' }).cep)).toBe(true);
  });

  it('os produtos e criativos da migration são os mesmos do app', () => {
    const lista = (re: RegExp) => [...(re.exec(sql)?.[1].matchAll(/'([a-z_]+)'/g) ?? [])].map((m) => m[1]);
    expect(lista(/ARRAY\[([^\]]+)\]/)).toEqual(Object.keys(PRODUTOS));
    expect(lista(/criativo_tipo IN \(([^)]+)\)/)).toEqual(Object.keys(CRIATIVOS));
    expect(lista(/objetivo IN \(([^)]+)\)/)).toEqual(Object.keys(OBJETIVOS));
  });

  it('a lista de destinatários nasce vazia: a migration não cadastra ninguém', () => {
    expect(sql).not.toMatch(/INSERT\s+INTO\s+public\.midia_local_email_recipients/i);
  });
});
