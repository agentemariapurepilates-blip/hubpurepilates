import { describe, it, expect } from 'vitest';
import {
  hojeEmSaoPaulo,
  podeAgendarPara,
  podeAlterar,
  prazoDeAlteracao,
  primeiraDataAgendavel,
} from './prazo';

// Este arquivo roda com TZ=UTC (fixado em vitest.config.ts), um fuso DIFERENTE
// de America/Sao_Paulo de propósito: se algum cálculo lesse o relógio da
// máquina em vez de ancorar em -03:00, as asserções abaixo quebrariam.
//
// A inauguração de 20/08/2026 começa em 2026-08-20T03:00:00Z (00:00 em SP).
const INAUGURACAO = '2026-08-20';
const MEIA_NOITE_SP = new Date('2026-08-20T03:00:00Z');

describe('prazoDeAlteracao', () => {
  it('trava na meia-noite de São Paulo do dia da inauguração', () => {
    expect(prazoDeAlteracao(INAUGURACAO).toISOString()).toBe(MEIA_NOITE_SP.toISOString());
  });

  it('ancora na data, não no relógio da máquina', () => {
    expect(prazoDeAlteracao('2026-01-15').toISOString()).toBe('2026-01-15T03:00:00.000Z');
  });
});

describe('podeAlterar', () => {
  it('permite bem antes da data', () => {
    expect(podeAlterar(INAUGURACAO, new Date('2026-08-01T12:00:00Z'))).toBe(true);
  });

  it('permite na véspera, dentro das antigas 48h', () => {
    // 19/08 às 12:00 em SP. Com a regra anterior isto estava BLOQUEADO; é
    // exatamente a mudança pedida.
    expect(podeAlterar(INAUGURACAO, new Date('2026-08-19T15:00:00Z'))).toBe(true);
  });

  it('permite às 23:59 da véspera', () => {
    expect(podeAlterar(INAUGURACAO, new Date(MEIA_NOITE_SP.getTime() - 60_000))).toBe(true);
  });

  it('bloqueia exatamente na meia-noite do dia', () => {
    expect(podeAlterar(INAUGURACAO, MEIA_NOITE_SP)).toBe(false);
  });

  it('bloqueia durante o próprio dia da inauguração', () => {
    expect(podeAlterar(INAUGURACAO, new Date('2026-08-20T14:00:00Z'))).toBe(false);
  });

  it('bloqueia depois da data', () => {
    expect(podeAlterar(INAUGURACAO, new Date('2026-09-01T12:00:00Z'))).toBe(false);
  });
});

describe('hojeEmSaoPaulo', () => {
  it('usa o dia de São Paulo, não o de UTC', () => {
    // 02:00Z de 05/08 ainda é 23:00 de 04/08 em São Paulo. Ler o dia em UTC
    // daria 05 e liberaria o calendário um dia antes do devido.
    expect(hojeEmSaoPaulo(new Date('2026-08-05T02:00:00Z'))).toBe('2026-08-04');
  });

  it('vira o dia às 03:00Z', () => {
    expect(hojeEmSaoPaulo(new Date('2026-08-05T03:00:00Z'))).toBe('2026-08-05');
  });
});

describe('podeAgendarPara', () => {
  const AGORA = new Date('2026-08-04T18:00:00Z'); // 15:00 de 04/08 em SP

  it('recusa o mesmo dia da solicitação', () => {
    expect(podeAgendarPara('2026-08-04', AGORA)).toBe(false);
  });

  it('recusa data no passado', () => {
    expect(podeAgendarPara('2026-08-03', AGORA)).toBe(false);
  });

  it('aceita amanhã', () => {
    expect(podeAgendarPara('2026-08-05', AGORA)).toBe(true);
  });

  it('aceita datas distantes', () => {
    expect(podeAgendarPara('2027-01-10', AGORA)).toBe(true);
  });

  it('recusa "hoje" mesmo perto da virada em SP', () => {
    // 02:00Z de 05/08 = 23:00 de 04/08 em SP: o dia ainda é 04.
    expect(podeAgendarPara('2026-08-04', new Date('2026-08-05T02:00:00Z'))).toBe(false);
    expect(podeAgendarPara('2026-08-05', new Date('2026-08-05T02:00:00Z'))).toBe(true);
  });
});

describe('primeiraDataAgendavel', () => {
  it('é o dia seguinte a hoje em São Paulo', () => {
    expect(primeiraDataAgendavel(new Date('2026-08-04T18:00:00Z'))).toBe('2026-08-05');
  });

  it('atravessa a virada de mês', () => {
    expect(primeiraDataAgendavel(new Date('2026-08-31T18:00:00Z'))).toBe('2026-09-01');
  });

  it('atravessa a virada de ano', () => {
    expect(primeiraDataAgendavel(new Date('2026-12-31T18:00:00Z'))).toBe('2027-01-01');
  });

  it('a primeira data agendável é sempre aceita por podeAgendarPara', () => {
    const agora = new Date('2026-08-04T18:00:00Z');
    expect(podeAgendarPara(primeiraDataAgendavel(agora), agora)).toBe(true);
  });
});
