import { describe, it, expect } from 'vitest';
import {
  destinatariosDoModo,
  ehSegredoDoCron,
  exigeAdmin,
  modoDaRequisicao,
} from '../../../../supabase/functions/_shared/modo-relatorio';

// As duas Edge Functions de relatório passam a atender TRÊS chamadores com
// poderes diferentes: o pg_cron (que envia para a lista inteira), e o admin
// logado no Hub pedindo uma prévia (que não envia nada) ou um teste (que envia
// só para ele). Confundir dois desses é o pior erro possível aqui — uma prévia
// que dispara, ou um teste que vai para a diretoria inteira.
//
// A decisão mora neste módulo, e não dentro do `Deno.serve`, justamente para
// poder ser testada: `index.ts` chama `Deno.serve` ao ser importado, então o
// vitest não consegue carregá-lo.

describe('modoDaRequisicao', () => {
  it('sem corpo é o cron — é assim que o pg_cron chama', () => {
    expect(modoDaRequisicao(undefined)).toBe('cron');
    expect(modoDaRequisicao(null)).toBe('cron');
  });

  it('corpo sem a chave modo também é o cron', () => {
    expect(modoDaRequisicao({})).toBe('cron');
  });

  it('reconhece prévia e teste', () => {
    expect(modoDaRequisicao({ modo: 'previa' })).toBe('previa');
    expect(modoDaRequisicao({ modo: 'teste' })).toBe('teste');
  });

  it('modo desconhecido é recusado em vez de virar cron', () => {
    // Cair no cron por engano mandaria o relatório para a lista inteira.
    expect(modoDaRequisicao({ modo: 'enviar' })).toBeNull();
    expect(modoDaRequisicao({ modo: '' })).toBeNull();
    expect(modoDaRequisicao({ modo: 7 })).toBeNull();
  });
});

describe('exigeAdmin', () => {
  it('prévia e teste só para admin', () => {
    expect(exigeAdmin('previa')).toBe(true);
    expect(exigeAdmin('teste')).toBe(true);
  });

  it('o cron não passa por admin nenhum — ele tem o segredo', () => {
    expect(exigeAdmin('cron')).toBe(false);
  });
});

describe('ehSegredoDoCron', () => {
  const segredo = 's3gr3d0';

  it('aceita o Bearer com o segredo exato', () => {
    expect(ehSegredoDoCron(`Bearer ${segredo}`, segredo)).toBe(true);
  });

  it('recusa outro token, cabeçalho ausente e formato errado', () => {
    expect(ehSegredoDoCron('Bearer outro', segredo)).toBe(false);
    expect(ehSegredoDoCron(null, segredo)).toBe(false);
    expect(ehSegredoDoCron(segredo, segredo)).toBe(false);
  });

  it('segredo vazio não autoriza ninguém, nem com cabeçalho vazio', () => {
    // Sem esta linha, uma function sem a variável de ambiente configurada
    // aceitaria `Bearer ` de qualquer um.
    expect(ehSegredoDoCron('Bearer ', '')).toBe(false);
    expect(ehSegredoDoCron('', '')).toBe(false);
  });
});

describe('destinatariosDoModo', () => {
  const lista = ['diretoria@purepilates.com.br', 'ana@purepilates.com.br'];
  const admin = 'daniel@purepilates.com.br';

  it('o cron manda para a lista inteira', () => {
    expect(destinatariosDoModo('cron', { lista, emailDoAdmin: admin })).toEqual(lista);
  });

  it('o teste vai SÓ para quem clicou, nunca para a lista', () => {
    // O erro mais caro possível nesta tela: um "enviar teste" que dispara o
    // relatório do mês para a diretoria.
    expect(destinatariosDoModo('teste', { lista, emailDoAdmin: admin })).toEqual([admin]);
  });

  it('a prévia não manda para ninguém', () => {
    expect(destinatariosDoModo('previa', { lista, emailDoAdmin: admin })).toEqual([]);
  });

  it('teste sem e-mail de admin não manda para a lista por falta de opção', () => {
    // Se o JWT vier sem e-mail, o certo é não enviar nada — cair na lista
    // seria transformar a ausência de um dado num envio para a rede toda.
    expect(destinatariosDoModo('teste', { lista, emailDoAdmin: null })).toEqual([]);
  });
});
