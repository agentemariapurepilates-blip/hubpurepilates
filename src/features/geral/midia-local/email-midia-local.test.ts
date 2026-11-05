import { describe, it, expect } from 'vitest';
import { ASSUNTO, EXEMPLO, montarModelo, renderizar } from '../../../../n8n/midia-local-email.mjs';

// O e-mail é montado no n8n a partir deste modelo. Os testes EXECUTAM o modelo
// como o n8n executa (cada {{ ... }} avaliado), então conferem o e-mail de
// verdade — não uma cópia dele.

const modelo = montarModelo();
const render = (troca: Record<string, unknown> = {}) => renderizar(modelo, { ...EXEMPLO, ...troca });
const texto = (html: string) => html.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

describe('e-mail da mídia local', () => {
  it('leva tudo que a Rise precisa para negociar e cobrar', () => {
    const t = texto(render());
    for (const dado of [
      'Pure Pilates Moema', 'Ana Souza', 'ana.souza@exemplo.com', '(11) 99999-1234',
      'Av. Ibirapuera, 2000 - Moema, São Paulo/SP', '04029-200',
      '01/12/2026 a 15/12/2026', 'Moema Pilates Ltda', '11.222.333/0001-81',
      'Rua das Flores, 10 - Centro, São Paulo/SP, CEP 01000-000',
      'TV mais digital', 'Near Live',
    ]) {
      expect(t).toContain(dado);
    }
  });

  it('avisa no topo que responder fala direto com o franqueado', () => {
    expect(texto(render())).toMatch(/Responder este e-mail fala direto com o franqueado \(Ana Souza\)/);
  });

  it('inauguração mostra a data; reforço não deixa sobra', () => {
    expect(texto(render())).toContain('Inauguração prevista (loja nova) · prevista para 10/01/2027');
    const reforco = texto(render({ objetivo_label: 'Reforço de marketing local', data_inauguracao_fmt: '' }));
    expect(reforco).toContain('Reforço de marketing local');
    expect(reforco).not.toContain('prevista para');
  });

  it('adaptação de campanha mostra o aviso de Ancine; cartela não', () => {
    expect(texto(render({ ancine: true }))).toContain('tem custo de Ancine');
    expect(texto(render({ ancine: false, criativo_label: 'Cartela com texto e foto' }))).not.toContain('O marketing da Pure recebeu cópia');
  });

  it('mantém as quebras de linha do texto do criativo', () => {
    const html = render({ criativo_info: 'linha um\nlinha dois' });
    expect(html).toContain('linha um<br>linha dois');
  });

  it('o que o franqueado digita não vira HTML dentro do e-mail', () => {
    const html = render({
      nome_unidade: '<b>Moema</b> & "Cia"',
      criativo_info: '<script>alert(1)</script>',
      endereco_cobranca: '<img src=x onerror=alert(1)>',
    });
    expect(html).toContain('&lt;b&gt;Moema&lt;/b&gt; &amp; &quot;Cia&quot;');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img src=x');
    expect(html).not.toContain('<b>Moema');
  });

  it('campo que faltar aparece como traço, e não como "undefined" ou "null"', () => {
    const t = texto(render({ telefone_fmt: undefined, cep: null, razao_social: '' }));
    expect(t).not.toMatch(/undefined|null/);
  });

  it('assunto leva a unidade e o período', () => {
    const assunto = renderizar(ASSUNTO.replace(/^=/, ''), EXEMPLO);
    expect(assunto).toBe('Mídia local TV Globo — Pure Pilates Moema (01/12/2026 a 15/12/2026)');
  });

  it('não depende de imagem remota (Gmail e Outlook bloqueiam)', () => {
    expect(render()).not.toMatch(/<img\b/i);
  });
});
