import { describe, expect, it } from 'vitest';

import {
  agruparPorCampanha,
  defeitosDosCriativos,
  lerCriativo,
  type AnuncioBruto,
} from './criativos';

/** Um anúncio ativo mínimo, no formato mais comum da conta. */
const anuncio = (extra: Partial<AnuncioBruto> = {}): AnuncioBruto => ({
  id: '1',
  name: 'anuncio',
  effective_status: 'ACTIVE',
  campaign: { name: '[Rise] always-on | apartadas' },
  adset: { name: 'moema' },
  creative: {
    object_story_spec: {
      link_data: {
        message: 'Agende sua aula experimental.',
        name: 'Pure Pilates Moema',
        call_to_action: { type: 'BOOK_TRAVEL', value: { link: 'https://purepilates.com.br' } },
      },
    },
  },
  ...extra,
});

describe('lerCriativo', () => {
  it('lê o texto de object_story_spec, que é onde a maioria dos anúncios guarda', () => {
    const lido = lerCriativo(anuncio());

    expect(lido.textos).toEqual(['Agende sua aula experimental.']);
    expect(lido.titulos).toEqual(['Pure Pilates Moema']);
    expect(lido.cta).toBe('BOOK_TRAVEL');
    expect(lido.link).toBe('https://purepilates.com.br');
    expect(lido.ativo).toBe(true);
  });

  it('lê vídeo pelo video_data, que substitui link_data', () => {
    const lido = lerCriativo(
      anuncio({
        creative: { object_story_spec: { video_data: { message: 'texto do vídeo' } } },
      }),
    );

    expect(lido.textos).toEqual(['texto do vídeo']);
  });

  // O DCO foi o formato que fez a primeira leitura perder metade dos anúncios:
  // ali os textos são listas de variações, não um campo só.
  it('lê TODAS as variações de um anúncio DCO', () => {
    const lido = lerCriativo(
      anuncio({
        creative: {
          asset_feed_spec: {
            bodies: [{ text: 'primeira versão' }, { text: 'segunda versão' }],
            titles: [{ text: 'Pilates perto de você' }],
            descriptions: [{ text: 'Agende sua aula' }],
            call_to_action_types: ['BOOK_TRAVEL'],
          },
        },
      }),
    );

    expect(lido.textos).toEqual(['primeira versão', 'segunda versão']);
    expect(lido.titulos).toEqual(['Pilates perto de você']);
    expect(lido.descricoes).toEqual(['Agende sua aula']);
    expect(lido.cta).toBe('BOOK_TRAVEL');
  });

  it('não repete o mesmo texto que aparece em dois campos', () => {
    const lido = lerCriativo(
      anuncio({
        creative: {
          body: 'mesmo texto',
          object_story_spec: { link_data: { message: 'mesmo texto' } },
        },
      }),
    );

    expect(lido.textos).toEqual(['mesmo texto']);
  });

  it('sobrevive a um anúncio sem criativo nenhum', () => {
    const lido = lerCriativo({ id: '9', effective_status: 'PAUSED' });

    expect(lido.textos).toEqual([]);
    expect(lido.cta).toBeNull();
    expect(lido.anuncio).toBe('(sem nome)');
    expect(lido.ativo).toBe(false);
  });
});

describe('defeitosDosCriativos', () => {
  // Este é o defeito de verdade encontrado na conta em 24/08/2026: um TAB no
  // meio de "na unidade \tJardim Paulistano", que sai como buraco no anúncio.
  it('acha tabulação escondida no meio da frase', () => {
    const defeitos = defeitosDosCriativos([
      lerCriativo(
        anuncio({
          creative: {
            object_story_spec: {
              link_data: { message: 'nossa equipe na unidade \tJardim Paulistano.' },
            },
          },
        }),
      ),
    ]);

    expect(defeitos.map((d) => d.tipo)).toContain('caractere-invisivel');
  });

  it('acha espaço duplicado', () => {
    const defeitos = defeitosDosCriativos([
      lerCriativo(
        anuncio({ creative: { object_story_spec: { link_data: { message: 'venha  treinar' } } } }),
      ),
    ]);

    expect(defeitos.map((d) => d.tipo)).toContain('espaco-duplicado');
  });

  // Na conta, 21 grupos de anúncios ativos dividem o mesmo texto, e quase todos
  // são o par `motion`/`post` do mesmo conjunto: mesma frase, arte diferente,
  // que é como se testa criativo. Alertar cada um encheria a tela de alarme
  // falso e afogaria as duas linhas que importam.
  it('NÃO reclama de dois anúncios com o mesmo texto — isso é teste de arte', () => {
    const defeitos = defeitosDosCriativos([
      lerCriativo(anuncio({ id: 'a', name: 'motion' })),
      lerCriativo(anuncio({ id: 'b', name: 'post' })),
    ]);

    expect(defeitos).toEqual([]);
  });

  it('avisa quando falta o botão de ação', () => {
    const defeitos = defeitosDosCriativos([
      lerCriativo(anuncio({ creative: { object_story_spec: { link_data: { message: 'texto' } } } })),
    ]);

    expect(defeitos.map((d) => d.tipo)).toContain('sem-cta');
  });

  // Anúncio pausado não incomoda ninguém; listá-lo afogaria o que importa.
  it('ignora anúncio pausado, por mais defeituoso que seja', () => {
    const defeitos = defeitosDosCriativos([
      lerCriativo(
        anuncio({
          effective_status: 'PAUSED',
          creative: { object_story_spec: { link_data: { message: 'texto  com \ttudo errado' } } },
        }),
      ),
    ]);

    expect(defeitos).toEqual([]);
  });
});

describe('agruparPorCampanha', () => {
  it('conta ativos e total, e junta os textos só dos ativos', () => {
    const grupos = agruparPorCampanha([
      lerCriativo(anuncio({ id: 'a' })),
      lerCriativo(
        anuncio({
          id: 'b',
          effective_status: 'PAUSED',
          creative: { object_story_spec: { link_data: { message: 'texto de anúncio pausado' } } },
        }),
      ),
    ]);

    expect(grupos).toHaveLength(1);
    expect(grupos[0].ativos).toBe(1);
    expect(grupos[0].total).toBe(2);
    expect(grupos[0].textos).toEqual([{ texto: 'Agende sua aula experimental.', anuncios: 1 }]);
  });

  it('conta em quantos anúncios cada texto aparece, do mais usado ao menos', () => {
    const grupos = agruparPorCampanha([
      lerCriativo(anuncio({ id: 'a' })),
      lerCriativo(anuncio({ id: 'b' })),
      lerCriativo(
        anuncio({
          id: 'c',
          creative: { object_story_spec: { link_data: { message: 'texto só desta peça' } } },
        }),
      ),
    ]);

    expect(grupos[0].textos).toEqual([
      { texto: 'Agende sua aula experimental.', anuncios: 2 },
      { texto: 'texto só desta peça', anuncios: 1 },
    ]);
  });

  // Um anúncio DCO pode listar a mesma frase duas vezes no feed de variações.
  it('conta um anúncio uma vez, mesmo que ele repita o texto internamente', () => {
    const grupos = agruparPorCampanha([
      lerCriativo(
        anuncio({
          creative: {
            body: 'mesma frase',
            asset_feed_spec: { bodies: [{ text: 'mesma frase' }] },
          },
        }),
      ),
    ]);

    expect(grupos[0].textos).toEqual([{ texto: 'mesma frase', anuncios: 1 }]);
  });

  it('põe a campanha com mais anúncios no ar em primeiro', () => {
    const grupos = agruparPorCampanha([
      lerCriativo(anuncio({ id: 'a', campaign: { name: 'pequena' } })),
      lerCriativo(anuncio({ id: 'b', campaign: { name: 'grande' } })),
      lerCriativo(anuncio({ id: 'c', campaign: { name: 'grande' } })),
    ]);

    expect(grupos.map((g) => g.campanha)).toEqual(['grande', 'pequena']);
  });
});
