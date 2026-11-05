import { describe, it, expect } from 'vitest';
import { conferirArtigo, criarSlug, escolherPalavraChave, limparHtml, tirarTravessao } from './texto';

describe('limparHtml', () => {
  it('mantém só as tags do blog e tira todos os atributos', () => {
    const sujo = '<h2 class="x" style="color:red">Por que?</h2><p onclick="alert(1)">Texto <strong>forte</strong></p>';
    expect(limparHtml(sujo)).toBe('<h2>Por que?</h2><p>Texto <strong>forte</strong></p>');
  });

  it('remove script, link, imagem e h1, mas mantém o texto do link', () => {
    const sujo = '<h1>Título</h1><script>roubar()</script><p>Veja <a href="https://x.com">aqui</a><img src="a.png"></p>';
    expect(limparHtml(sujo)).toBe('Título<p>Veja aqui</p>');
  });

  it('troca o travessão por vírgula', () => {
    expect(limparHtml('<p>Pilates — com aparelhos — é outra coisa</p>')).toBe('<p>Pilates, com aparelhos, é outra coisa</p>');
  });
});

describe('criarSlug', () => {
  it('tira acento, pontuação e caixa alta', () => {
    expect(criarSlug('Pilates para Postura: o que você precisa saber!')).toBe('pilates-para-postura-o-que-voce-precisa-saber');
  });

  it('corta em oito palavras', () => {
    expect(criarSlug('um dois tres quatro cinco seis sete oito nove dez')).toBe('um-dois-tres-quatro-cinco-seis-sete-oito');
  });
});

describe('tirarTravessao', () => {
  it('troca o travessão por vírgula e apara as pontas', () => {
    expect(tirarTravessao('  Pilates — o guia ')).toBe('Pilates, o guia');
  });
});

describe('acentos em código HTML', () => {
  it('limparHtml troca &ccedil; e companhia pelo acento de verdade', () => {
    expect(limparHtml('<p>come&ccedil;o, cora&ccedil;&atilde;o, &Eacute; voc&ecirc;&nbsp;e &#233;</p>')).toBe('<p>começo, coração, É você e é</p>');
  });

  it('não abre tag escondida em &lt;', () => {
    expect(limparHtml('<p>&lt;script&gt;</p>')).toBe('<p>&lt;script&gt;</p>');
  });
});

describe('conferirArtigo', () => {
  const bom = {
    titulo: 'Pilates para postura: o guia de quem trabalha sentado',
    meta_descricao:
      'Trabalha sentado o dia todo? Veja como o Pilates para postura fortalece a coluna, alivia tensões e deixa a rotina mais leve. Venha conhecer a Pure.',
    conteudo_html: [
      '<p>Se você passa o dia na cadeira, o Pilates para postura pode mudar a sua rotina.</p>',
      '<h2>O que é Pilates para postura?</h2><p>Explicação com pilates para postura.</p>',
      '<h2>Por que a cadeira cansa?</h2><p>Texto.</p>',
      '<h2>Como começar?</h2><p>Mais um pouco de Pilates para Postura.</p>',
      '<h2>Conclusão</h2><p>Fim.</p>',
    ].join(''),
  };

  it('aprova o artigo que cumpre tudo, sem ligar para acento e maiúscula', () => {
    expect(conferirArtigo(bom, 'pilates para postura')).toEqual([]);
  });

  it('aponta cada regra de SEO que faltou', () => {
    const ruim = { titulo: 'Um título qualquer', meta_descricao: '', conteudo_html: '<p>Abertura sem nada.</p><h2>Só um</h2>' };
    const problemas = conferirArtigo(ruim, 'pilates para postura');
    expect(problemas).toContain('Falta a meta descrição.');
    expect(problemas).toContain('A palavra-chave não está no título.');
    expect(problemas).toContain('A palavra-chave não está no primeiro parágrafo.');
    expect(problemas).toContain('A palavra-chave não aparece em nenhum subtítulo.');
    expect(problemas).toContain('O texto tem 1 subtítulos; o mínimo é 4.');
  });

  it('barra aula grátis e gratuita em qualquer lugar do texto', () => {
    const comGratis = { ...bom, conteudo_html: bom.conteudo_html.replace('Fim.', 'Agende sua aula gratuita.') };
    expect(conferirArtigo(comGratis, 'pilates para postura')).toContain('O texto fala em aula grátis ou gratuita, o que é proibido.');
    const comEntidade = { ...bom, conteudo_html: bom.conteudo_html.replace('Fim.', 'Aula gr&aacute;tis.') };
    expect(conferirArtigo(comEntidade, 'pilates para postura')).toContain('O texto fala em aula grátis ou gratuita, o que é proibido.');
  });

  it('cobra a palavra-chave quando ela não existe', () => {
    expect(conferirArtigo(bom, '')).toContain('Falta a palavra-chave principal.');
  });
});

describe('escolherPalavraChave', () => {
  it('fica com a versão acentuada quando é a mesma palavra-chave', () => {
    expect(escolherPalavraChave('transicao de carreira bem estar', 'transição de carreira bem-estar')).toBe('transição de carreira bem-estar');
  });

  it('a pauta manda quando o Gemini troca a palavra-chave', () => {
    expect(escolherPalavraChave('pilates para postura', 'pilates para coluna')).toBe('pilates para postura');
  });

  it('sem pauta, vale a do Gemini', () => {
    expect(escolherPalavraChave('', 'pilates para idosos')).toBe('pilates para idosos');
    expect(escolherPalavraChave(undefined, 'pilates para idosos')).toBe('pilates para idosos');
  });
});
