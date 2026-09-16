import { describe, it, expect } from 'vitest';
import {
  lerPasta,
  limparTitulo,
  montarEpisodios,
  ordenarTemporadas,
} from '../../../../supabase/functions/segredos-pilar-episodios/pasta';

// Trecho real da embeddedfolderview da pasta da série em 16/09/2026.
const HTML_REAL =
  '<div class="flip-entries"><div class="flip-entry" id="entry-1C5M1PAmSLLo8MtoQVVe-Hd9s3dMNxk7x" tabindex="0" role="link"><div class="flip-entry-info"><a href="https://drive.google.com/file/d/1C5M1PAmSLLo8MtoQVVe-Hd9s3dMNxk7x/view?usp=drive_web" target="_blank"><div class="flip-entry-visual"><div class="flip-entry-visual-card"><div class="flip-entry-thumb"><img src="https://lh3.googleusercontent.com/drive-storage/AAA=s190" alt="Video"/></div></div></div><div class="flip-entry-list-icon"><img src="https://drive-thirdparty.googleusercontent.com/16/type/video/quicktime" alt=""/></div><div class="flip-entry-title">Episódio 1 - A Aula que Vale ouro-v5.mov</div></a></div><div class="flip-entry-last-modified"><div>Sep 14</div></div></div>' +
  '<div class="flip-entry" id="entry-15AuSnfClOBcdgauSP_Y1ddkCL5Eapne6" tabindex="0" role="link"><div class="flip-entry-info"><a href="https://drive.google.com/file/d/15AuSnfClOBcdgauSP_Y1ddkCL5Eapne6/view?usp=drive_web" target="_blank"><div class="flip-entry-visual"><div class="flip-entry-visual-card"><div class="flip-entry-thumb"><img src="https://lh3.googleusercontent.com/drive-storage/BBB=s190" alt="Video"/></div></div></div><div class="flip-entry-list-icon"><img src="https://drive-thirdparty.googleusercontent.com/16/type/video/quicktime" alt=""/></div><div class="flip-entry-title">Episódio 2 - R de Recepcionar_v3.mov</div></a></div><div class="flip-entry-last-modified"><div>Sep 15</div></div></div></div>';

const pasta = (id: string, nome: string) =>
  `<div class="flip-entry" id="entry-${id}"><div class="flip-entry-info"><a href="https://drive.google.com/drive/folders/${id}"><div class="flip-entry-title">${nome}</div></a></div></div>`;

describe('lerPasta', () => {
  it('lê os vídeos reais da pasta, com id, nome e capa ampliada', () => {
    expect(lerPasta(HTML_REAL)).toEqual([
      {
        id: '1C5M1PAmSLLo8MtoQVVe-Hd9s3dMNxk7x',
        nome: 'Episódio 1 - A Aula que Vale ouro-v5.mov',
        tipo: 'video',
        capa: 'https://lh3.googleusercontent.com/drive-storage/AAA=w1280',
      },
      {
        id: '15AuSnfClOBcdgauSP_Y1ddkCL5Eapne6',
        nome: 'Episódio 2 - R de Recepcionar_v3.mov',
        tipo: 'video',
        capa: 'https://lh3.googleusercontent.com/drive-storage/BBB=w1280',
      },
    ]);
  });

  it('reconhece subpastas e decodifica entidades HTML no nome', () => {
    expect(lerPasta(pasta('abc', 'Temporada 1 &amp; Bastidores'))).toEqual([
      { id: 'abc', nome: 'Temporada 1 & Bastidores', tipo: 'pasta', capa: null },
    ]);
  });

  it('normaliza acento separado (arquivo enviado do Mac), como veio da pasta real', () => {
    const [item] = lerPasta(HTML_REAL.replace('Episódio 1', 'Episódio 1'));
    expect(item.nome).toBe('Episódio 1 - A Aula que Vale ouro-v5.mov');
    expect(limparTitulo('Episódio 1 - A Aula-v5.mov')).toEqual({ numero: 1, titulo: 'A Aula' });
  });

  it('HTML inesperado vira lista vazia, sem quebrar', () => {
    expect(lerPasta('<html>Precisa fazer login</html>')).toEqual([]);
  });
});

describe('limparTitulo', () => {
  it('tira extensão, versão e o prefixo do episódio dos arquivos reais', () => {
    expect(limparTitulo('Episódio 1 - A Aula que Vale ouro-v5.mov')).toEqual({
      numero: 1,
      titulo: 'A Aula que Vale ouro',
    });
    expect(limparTitulo('Episódio 2 - R de Recepcionar_v3.mov')).toEqual({
      numero: 2,
      titulo: 'R de Recepcionar',
    });
  });

  it.each([
    ['Ep. 03: Core forte V2.mp4', 3, 'Core forte'],
    ['E04 respiração_final.mov', 4, 'Respiração'],
    ['05 - Postura (1).mp4', 5, 'Postura'],
    ['Episodio 6 - Alongamento versão 2 - Cópia.mov', 6, 'Alongamento'],
    ['07_-_Mobilidade_v1.2.mov', 7, 'Mobilidade'],
  ])('%s → episódio %i "%s"', (arquivo, numero, titulo) => {
    expect(limparTitulo(arquivo)).toEqual({ numero, titulo });
  });

  it('não confunde título com sufixo de trabalho nem com número de episódio', () => {
    expect(limparTitulo('Episódio 9 - A Grande Final.mov')).toEqual({ numero: 9, titulo: 'A Grande Final' });
    expect(limparTitulo('10 exercícios para o dia a dia.mp4')).toEqual({
      numero: null,
      titulo: '10 exercícios para o dia a dia',
    });
  });
});

describe('montarEpisodios', () => {
  it('ordena pelo número (10 depois de 2), ignora o que não é vídeo e põe sem número no fim', () => {
    const eps = montarEpisodios([
      { id: 'c', nome: 'Episódio 10 - Dez.mov', tipo: 'video', capa: null },
      { id: 'x', nome: 'roteiro.pdf', tipo: 'outro', capa: null },
      { id: 'd', nome: 'Bônus bastidores.mp4', tipo: 'video', capa: null },
      { id: 'b', nome: 'Episódio 2 - Dois.mov', tipo: 'video', capa: null },
    ]);
    expect(eps.map((e) => e.driveId)).toEqual(['b', 'c', 'd']);
  });
});

describe('ordenarTemporadas', () => {
  it('raiz primeiro, depois por número, e some com temporada vazia', () => {
    const ep = { numero: 1, titulo: 'x', driveId: 'x', capa: null };
    const ordem = ordenarTemporadas([
      { titulo: 'Temporada 10', episodios: [ep] },
      { titulo: 'Temporada 2', episodios: [ep] },
      { titulo: null, episodios: [ep] },
      { titulo: 'Rascunhos', episodios: [] },
    ]).map((t) => t.titulo);
    expect(ordem).toEqual([null, 'Temporada 2', 'Temporada 10']);
  });
});
