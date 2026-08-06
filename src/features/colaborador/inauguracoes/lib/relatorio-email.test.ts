import { describe, it, expect } from 'vitest';
import {
  esc,
  janelas,
  montarEmail,
  somarDias,
  type InauguracaoDoRelatorio,
} from '../../../../../supabase/functions/inauguracao-relatorio-semanal/email';

// Testa o modulo puro da Edge Function do relatorio semanal. Vive aqui, e nao
// em supabase/functions/, porque e este projeto que roda o vitest.
//
// O que se testa e o que erra em silencio: as janelas de data (um dia a mais ou
// a menos e uma unidade some do relatorio sem ninguem perceber) e o escape do
// HTML (o endereco e digitado por um colaborador).

function unidade(data: string, nome = 'Pure Pilates Moema'): InauguracaoDoRelatorio {
  return {
    nome_unidade: nome,
    unidade_id: '1234',
    endereco: 'Rua Gaivota, 220',
    solicitante_nome: 'Mariana',
    data_inauguracao: data,
  };
}

describe('somarDias', () => {
  it('anda para frente e para tras', () => {
    expect(somarDias('2026-08-10', 6)).toBe('2026-08-16');
    expect(somarDias('2026-08-10', -7)).toBe('2026-08-03');
  });

  it('atravessa virada de mes e de ano', () => {
    expect(somarDias('2026-08-31', 1)).toBe('2026-09-01');
    expect(somarDias('2026-12-31', 1)).toBe('2027-01-01');
    expect(somarDias('2027-01-01', -1)).toBe('2026-12-31');
  });

  it('acerta ano bissexto', () => {
    expect(somarDias('2028-02-28', 1)).toBe('2028-02-29');
    expect(somarDias('2028-02-29', 1)).toBe('2028-03-01');
  });
});

describe('janelas', () => {
  it('as duas semanas se encostam sem sobrepor nem deixar buraco', () => {
    const j = janelas('2026-08-10');
    expect(j.inicioPassada).toBe('2026-08-03');
    expect(j.fimPassada).toBe('2026-08-09');
    expect(j.inicioProxima).toBe('2026-08-10');
    expect(j.fimProxima).toBe('2026-08-16');

    // O dia seguinte ao fim da passada e o inicio da proxima: nenhuma data
    // entre 03/08 e 16/08 fica de fora das duas consultas.
    expect(somarDias(j.fimPassada, 1)).toBe(j.inicioProxima);
  });

  it('cobre exatamente 14 dias', () => {
    const j = janelas('2026-08-10');
    expect(somarDias(j.inicioPassada, 13)).toBe(j.fimProxima);
  });
});

describe('esc', () => {
  it('neutraliza marcação vinda do banco', () => {
    expect(esc('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;',
    );
    expect(esc('Rua "A" & B')).toBe('Rua &quot;A&quot; &amp; B');
  });

  it('não quebra com texto normal nem com vazio', () => {
    expect(esc('Pure Pilates Moema')).toBe('Pure Pilates Moema');
    expect(esc('')).toBe('');
  });
});

describe('montarEmail', () => {
  const HOJE = '2026-08-10';

  it('o assunto conta a PRÓXIMA semana, não o total', () => {
    const { assunto } = montarEmail(
      [unidade('2026-08-05'), unidade('2026-08-07')],
      [unidade('2026-08-12')],
      HOJE,
    );
    // Duas na semana passada e uma na próxima: o assunto diz 1, porque quem lê
    // a caixa de entrada precisa saber o que vem, não o que já passou.
    expect(assunto).toContain('1 nesta semana');
    expect(assunto).not.toContain('3');
  });

  it('avisa quando não há nada marcado para a próxima semana', () => {
    const { assunto, corpo } = montarEmail([unidade('2026-08-05')], [], HOJE);
    expect(assunto).toContain('nenhuma nesta semana');
    expect(corpo).toContain('Nenhuma inauguração marcada.');
  });

  it('mostra as duas seções com os períodos certos', () => {
    const { corpo } = montarEmail([], [], HOJE);
    expect(corpo).toContain('Semana que passou');
    expect(corpo).toContain('03/08/2026 a 09/08/2026');
    expect(corpo).toContain('Próxima semana');
    expect(corpo).toContain('10/08/2026 a 16/08/2026');
    expect(corpo).toContain('Nenhuma unidade inaugurou.');
  });

  it('lista as unidades com data, id, endereço e solicitante', () => {
    const { corpo } = montarEmail([], [unidade('2026-08-12', 'Pure Pilates Santana')], HOJE);
    expect(corpo).toContain('12/08/2026');
    expect(corpo).toContain('Pure Pilates Santana');
    expect(corpo).toContain('ID 1234');
    expect(corpo).toContain('Rua Gaivota, 220');
    expect(corpo).toContain('Solicitado por Mariana');
  });

  it('escapa o que veio do banco antes de virar HTML', () => {
    const maliciosa: InauguracaoDoRelatorio = {
      ...unidade('2026-08-12'),
      nome_unidade: '<img src=x onerror=alert(1)>',
      endereco: 'Rua & Cia <b>',
    };
    const { corpo } = montarEmail([], [maliciosa], HOJE);

    expect(corpo).not.toContain('<img src=x');
    expect(corpo).toContain('&lt;img src=x');
    expect(corpo).toContain('Rua &amp; Cia &lt;b&gt;');
  });

  it('usa a identidade do Hub', () => {
    const { corpo } = montarEmail([], [], HOJE);
    expect(corpo).toContain('#c5203c');
    expect(corpo).toContain('Montserrat');
    expect(corpo).toContain('Inter');
  });
});
