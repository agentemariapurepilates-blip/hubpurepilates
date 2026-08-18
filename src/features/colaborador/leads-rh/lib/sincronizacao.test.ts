import { describe, expect, it } from 'vitest';
import { proximaCarga, statusDaSincronizacao, tempoDecorrido } from './sincronizacao';

const iso = (d: Date) => d.toISOString();

describe('proximaCarga', () => {
  it('aponta para as 3h de São Paulo do dia seguinte quando já passou', () => {
    // 18/08 às 10:00 em SP (13:00 UTC) → próxima carga 19/08 às 03:00 SP.
    const proxima = proximaCarga(new Date('2026-08-18T13:00:00Z'));
    expect(iso(proxima)).toBe('2026-08-19T06:00:00.000Z');
  });

  it('aponta para hoje quando ainda não deu a hora', () => {
    // 18/08 à 01:00 em SP (04:00 UTC) → a carga de hoje ainda vem.
    const proxima = proximaCarga(new Date('2026-08-18T04:00:00Z'));
    expect(iso(proxima)).toBe('2026-08-18T06:00:00.000Z');
  });

  it('não depende do fuso de quem abre a tela', () => {
    // O cálculo é feito em UTC com o deslocamento fixo de São Paulo. Se usasse
    // o fuso local, alguém em Portugal veria um horário diferente.
    const deUmInstante = new Date('2026-08-18T13:00:00Z');
    expect(iso(proximaCarga(deUmInstante))).toBe('2026-08-19T06:00:00.000Z');
  });

  it('vira o mês corretamente', () => {
    const proxima = proximaCarga(new Date('2026-08-31T13:00:00Z'));
    expect(iso(proxima)).toBe('2026-09-01T06:00:00.000Z');
  });
});

describe('statusDaSincronizacao', () => {
  const agora = new Date('2026-08-18T13:00:00Z');

  it('em prévia COM agendamento, promete a próxima carga', () => {
    // A tarefa diária local existe: esconder a próxima faria a tela dizer
    // que nada vai acontecer quando algo vai.
    const s = statusDaSincronizacao({
      ultimaSincronizacao: '2026-08-18T12:00:00Z',
      ehPrevia: true,
      agendada: true,
      agora,
    });
    expect(s.estado).toBe('previa');
    expect(s.proxima).not.toBeNull();
    expect(iso(s.proxima!)).toBe('2026-08-19T06:00:00.000Z');
  });

  it('em prévia SEM agendamento, não promete próxima', () => {
    // Prévia é retrato congelado: chamar de "em dia" seria mentira.
    const s = statusDaSincronizacao({
      ultimaSincronizacao: '2026-08-18T12:00:00Z',
      ehPrevia: true,
      agora,
    });
    expect(s.estado).toBe('previa');
    expect(s.proxima).toBeNull();
  });

  it('reconhece que nunca rodou', () => {
    const s = statusDaSincronizacao({ ultimaSincronizacao: null, ehPrevia: false, agora });
    expect(s.estado).toBe('nunca-rodou');
    expect(s.ultima).toBeNull();
    // Mesmo sem ter rodado, a próxima está agendada.
    expect(s.proxima).not.toBeNull();
  });

  it('considera em dia quando rodou nas últimas 26 horas', () => {
    const s = statusDaSincronizacao({
      ultimaSincronizacao: '2026-08-18T06:00:00Z',
      ehPrevia: false,
      agora,
    });
    expect(s.estado).toBe('em-dia');
    expect(s.atrasada).toBe(false);
    expect(s.horasDesde).toBeCloseTo(7, 1);
  });

  it('tolera 26 horas, e não 24 cravadas', () => {
    // Com 24 exatos, todo dia haveria uma janela em que a tela acusaria atraso
    // sem haver nenhum: a carga leva minutos e o cron oscila.
    const vinteECinco = statusDaSincronizacao({
      ultimaSincronizacao: '2026-08-17T12:00:00Z',
      ehPrevia: false,
      agora,
    });
    expect(vinteECinco.estado).toBe('em-dia');

    const vinteESete = statusDaSincronizacao({
      ultimaSincronizacao: '2026-08-17T09:00:00Z',
      ehPrevia: false,
      agora,
    });
    expect(vinteESete.estado).toBe('atrasada');
  });

  it('não quebra com data inválida', () => {
    const s = statusDaSincronizacao({ ultimaSincronizacao: 'ontem', ehPrevia: false, agora });
    expect(s.estado).toBe('nunca-rodou');
  });
});

describe('tempoDecorrido', () => {
  it('fala como uma pessoa falaria', () => {
    expect(tempoDecorrido(0.5)).toBe('há menos de uma hora');
    expect(tempoDecorrido(1.5)).toBe('há uma hora');
    expect(tempoDecorrido(7)).toBe('há 7 horas');
    expect(tempoDecorrido(30)).toBe('ontem');
    expect(tempoDecorrido(80)).toBe('há 3 dias');
  });

  it('devolve travessão quando não há referência', () => {
    expect(tempoDecorrido(null)).toBe('—');
  });
});
