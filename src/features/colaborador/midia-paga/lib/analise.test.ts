import { describe, expect, it } from 'vitest';
import { diagnosticar, mediana, type LinhaDeMidia } from './analise';
import { PARAMETROS, REGRAS } from '../dados/cerebro';

const base: LinhaDeMidia = {
  plataforma: 'meta',
  conjuntoId: 'a',
  conjunto: 'dco | interesses | leads | sacoma',
  campanha: '[Rise] dco | always-on | apartadas',
  status: 'ACTIVE',
  unidadeVinculada: { id: 'u1', nome: 'Sacomã' },
  dias: 30,
  gasto: 1000,
  resultados: 10,
  impressoes: 50000,
  cliques: 900,
};

const linha = (mudancas: Partial<LinhaDeMidia>): LinhaDeMidia => ({ ...base, ...mudancas });

const opcoes = { de: '2026-05-01', ate: '2026-07-31', fontesConectadas: ['meta' as const] };

const achadosDe = (d: ReturnType<typeof diagnosticar>, regraId: string) =>
  d.achados.filter((a) => a.regraId === regraId);

describe('mediana', () => {
  it('devolve nulo para lista vazia', () => {
    expect(mediana([])).toBeNull();
  });

  it('tira a média dos dois do meio quando a lista é par', () => {
    expect(mediana([10, 20, 30, 40])).toBe(25);
  });

  it('não depende da ordem de entrada', () => {
    expect(mediana([30, 10, 20])).toBe(20);
  });
});

describe('diagnosticar', () => {
  it('soma os totais e calcula o custo por resultado', () => {
    const d = diagnosticar([linha({}), linha({ conjuntoId: 'b', gasto: 500, resultados: 5 })], opcoes);
    expect(d.totais.gasto).toBe(1500);
    expect(d.totais.resultados).toBe(15);
    expect(d.totais.custoPorResultado).toBe(100);
  });

  it('não divide por zero quando ninguém gerou resultado', () => {
    const d = diagnosticar([linha({ resultados: 0, impressoes: 100 })], opcoes);
    expect(d.totais.custoPorResultado).toBeNull();
  });

  it('acusa conjunto com gasto e sem unidade vinculada', () => {
    const d = diagnosticar([linha({ unidadeVinculada: null })], opcoes);
    expect(achadosDe(d, 'conjunto-sem-unidade')).toHaveLength(1);
    expect(achadosDe(d, 'conjunto-sem-unidade')[0].gravidade).toBe('alta');
  });

  it('não cobra vínculo de frente que não é por unidade', () => {
    const d = diagnosticar(
      [
        linha({
          campanha: '[Rise] venda | always-on | pilates play',
          conjunto: 'always-on | pilates play | interesses',
          unidadeVinculada: null,
        }),
      ],
      opcoes,
    );
    expect(achadosDe(d, 'conjunto-sem-unidade')).toHaveLength(0);
  });

  it('cobra resultado só depois de impressão suficiente', () => {
    const pouco = diagnosticar(
      [linha({ resultados: 0, impressoes: PARAMETROS.impressoesParaCobrarResultado - 1 })],
      opcoes,
    );
    expect(achadosDe(pouco, 'gasto-sem-resultado')).toHaveLength(0);

    const muito = diagnosticar(
      [linha({ resultados: 0, impressoes: PARAMETROS.impressoesParaCobrarResultado })],
      opcoes,
    );
    expect(achadosDe(muito, 'gasto-sem-resultado')).toHaveLength(1);
  });

  it('compara o custo com a mediana da mesma frente, não com um número fixo', () => {
    // Três conjuntos a R$ 100/resultado e um a R$ 400. A mediana é 100, o teto
    // é 150, então só o caro aparece.
    const d = diagnosticar(
      [
        linha({ conjuntoId: '1', gasto: 1000, resultados: 10 }),
        linha({ conjuntoId: '2', gasto: 1000, resultados: 10 }),
        linha({ conjuntoId: '3', gasto: 1000, resultados: 10 }),
        linha({ conjuntoId: '4', conjunto: 'dco | interesses | leads | taipas', gasto: 1200, resultados: 3 }),
      ],
      opcoes,
    );
    const caros = achadosDe(d, 'custo-fora-da-faixa');
    expect(caros).toHaveLength(1);
    expect(caros[0].alvo).toBe('dco | interesses | leads | taipas');
  });

  it('deixa de fora da comparação o conjunto que quase não gastou', () => {
    const d = diagnosticar(
      [
        linha({ conjuntoId: '1', gasto: 1000, resultados: 10 }),
        linha({ conjuntoId: '2', gasto: 1000, resultados: 10 }),
        // R$ 50 e 1 resultado dá R$ 50 — dentro. Mas com R$ 90 e 0,1 resultado
        // o ruído domina, por isso o piso de gasto existe.
        linha({
          conjuntoId: '3',
          conjunto: 'dco | interesses | leads | penha',
          gasto: PARAMETROS.gastoMinimoParaComparar - 1,
          resultados: 1,
          impressoes: 100,
        }),
      ],
      opcoes,
    );
    expect(achadosDe(d, 'custo-fora-da-faixa')).toHaveLength(0);
  });

  it('acusa dois conjuntos ativos com o mesmo nome', () => {
    const d = diagnosticar(
      [linha({ conjuntoId: '1' }), linha({ conjuntoId: '2' })],
      opcoes,
    );
    const duplicados = achadosDe(d, 'conjunto-duplicado');
    expect(duplicados).toHaveLength(1);
    expect(duplicados[0].detalhe).toContain('2 conjuntos ativos');
  });

  it('não acusa duplicata quando um dos dois está pausado', () => {
    const d = diagnosticar(
      [linha({ conjuntoId: '1' }), linha({ conjuntoId: '2', status: 'PAUSED' })],
      opcoes,
    );
    expect(achadosDe(d, 'conjunto-duplicado')).toHaveLength(0);
  });

  it('junta as frentes sem dado num achado só, sem perder nenhuma', () => {
    const d = diagnosticar([linha({})], opcoes);
    const semDado = achadosDe(d, 'frente-sem-dado');
    // Só "apartadas" teve linha. As outras seis entram num cartão único: seis
    // cartões idênticos empurrariam os achados de verdade para o fim da lista.
    expect(semDado).toHaveLength(1);
    expect(semDado[0].detalhe).toContain('6 de 7 frentes');
    for (const nome of ['Agendamento de aula', 'DCO', 'Remarketing', 'Campanhas de RH', 'Academy', 'Pilates Play']) {
      expect(semDado[0].alvo, nome).toContain(nome);
    }
    expect(semDado[0].alvo).not.toContain('Apartadas');
  });

  it('não acusa nada quando toda frente tem dado', () => {
    const todasAsFrentes = [
      linha({ conjuntoId: '1', campanha: '[Rise] dco | always-on | apartadas' }),
      linha({ conjuntoId: '2', campanha: '[Rise] dco | always-on | todas' }),
      linha({ conjuntoId: '3', campanha: '[Rise] dco | always-on | remarketing' }),
      linha({ conjuntoId: '4', campanha: '[Rise] lead-ad | always-on | rh-instrutor' }),
      linha({ conjuntoId: '5', campanha: '[Rise] lead-ad | always-on | academy' }),
      linha({ conjuntoId: '6', campanha: '[Rise] venda | always-on | pilates play' }),
      linha({ conjuntoId: '7', campanha: '[Rise] lead-site | always-on | agendamento' }),
    ];
    expect(achadosDe(diagnosticar(todasAsFrentes, opcoes), 'frente-sem-dado')).toHaveLength(0);
  });

  it('marca como técnico só o alvo que é nome do gerenciador', () => {
    // A tela escolhe monoespaçada por este campo. "dco | interesses | ..." é
    // código e precisa dela; "Google Ads" e a lista de frentes são português e
    // ficam ilegíveis em mono com quebra por caractere.
    const d = diagnosticar([linha({ unidadeVinculada: null })], opcoes);
    const tecnico = (regraId: string) => achadosDe(d, regraId)[0].alvoTecnico;
    expect(tecnico('conjunto-sem-unidade')).toBe(true);
    expect(tecnico('fonte-ausente')).toBe(false);
    expect(tecnico('frente-sem-dado')).toBe(false);
  });

  it('acusa cada fonte prevista e não conectada', () => {
    const d = diagnosticar([linha({})], opcoes);
    const ausentes = achadosDe(d, 'fonte-ausente');
    expect(ausentes.map((a) => a.alvo).sort()).toEqual(['Google Ads', 'Google Analytics 4']);
    expect(d.fontes.find((f) => f.id === 'meta')?.conectada).toBe(true);
  });

  it('lista a campanha que o manual não cobre em vez de escondê-la', () => {
    const d = diagnosticar(
      [linha({ campanha: '[Rise] venda | always-on | store', conjunto: 'always-on | store | rmkt' })],
      opcoes,
    );
    expect(d.foraDoManual).toEqual(['[Rise] venda | always-on | store']);
  });

  it('ordena por gravidade e, dentro dela, por dinheiro envolvido', () => {
    const d = diagnosticar(
      [
        linha({ conjuntoId: '1', unidadeVinculada: null, gasto: 200 }),
        linha({ conjuntoId: '2', conjunto: 'dco | interesses | leads | taipas', unidadeVinculada: null, gasto: 9000 }),
      ],
      opcoes,
    );
    const altas = d.achados.filter((a) => a.gravidade === 'alta' && a.regraId === 'conjunto-sem-unidade');
    expect(altas[0].gasto).toBe(9000);
    expect(d.achados.findIndex((a) => a.gravidade === 'alta')).toBe(0);
  });
});

describe('manual e diagnóstico não podem descolar', () => {
  it('toda regra declarada no manual é usada por alguma verificação', () => {
    // Um cenário que dispara todas as regras de uma vez. Se alguém acrescentar
    // uma regra ao manual e esquecer de verificá-la, este teste quebra.
    const d = diagnosticar(
      [
        linha({ conjuntoId: '1', unidadeVinculada: null }),
        linha({ conjuntoId: '2', resultados: 0, impressoes: 90000 }),
        linha({ conjuntoId: '3', gasto: 1000, resultados: 10 }),
        linha({ conjuntoId: '4', gasto: 1000, resultados: 10 }),
        linha({ conjuntoId: '5', conjunto: 'dco | interesses | leads | penha', gasto: 5000, resultados: 2 }),
        linha({ conjuntoId: '6', campanha: 'sem padrao nenhum', conjunto: 'sem padrao nenhum' }),
      ],
      { ...opcoes, fontesConectadas: ['meta'] },
    );

    const usadas = new Set(d.achados.map((a) => a.regraId));
    for (const regra of REGRAS) {
      expect(usadas.has(regra.id), `regra sem verificação: ${regra.id}`).toBe(true);
    }
  });
});
