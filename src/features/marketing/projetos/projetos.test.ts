import { describe, it, expect } from 'vitest';
import { dataCurta, descendentes, etapaAtual, faixasDasEtapas, progresso, sinalDoPrazo, tipoDoArquivo } from './projetos';

const prazos = {
  prazo_pre_planejamento: '2026-11-05',
  prazo_planejamento: '2026-11-10',
  prazo_producao: '2026-11-20',
  prazo_no_ar: '2026-11-30',
};

describe('etapaAtual', () => {
  it('é a primeira etapa cujo prazo ainda não passou', () => {
    expect(etapaAtual(prazos, '2026-11-09')).toBe('planejamento');
    expect(etapaAtual(prazos, '2026-11-10')).toBe('planejamento');
    expect(etapaAtual(prazos, '2026-11-11')).toBe('producao');
  });

  it('com tudo vencido, fica na última etapa', () => {
    expect(etapaAtual(prazos, '2026-12-15')).toBe('no_ar');
  });

  it('sem prazo nenhum, não tem etapa', () => {
    expect(etapaAtual({ prazo_pre_planejamento: null, prazo_planejamento: null, prazo_producao: null, prazo_no_ar: null })).toBeNull();
  });

  it('pula etapa sem prazo', () => {
    expect(etapaAtual({ ...prazos, prazo_planejamento: null }, '2026-11-09')).toBe('producao');
  });
});

describe('sinalDoPrazo', () => {
  it('atrasado, perto ou no prazo', () => {
    expect(sinalDoPrazo('2026-11-08', false, '2026-11-09')).toBe('atrasado');
    expect(sinalDoPrazo('2026-11-11', false, '2026-11-09')).toBe('perto');
    expect(sinalDoPrazo('2026-11-20', false, '2026-11-09')).toBe('ok');
  });

  it('concluído ou sem prazo não acusa nada', () => {
    expect(sinalDoPrazo('2026-11-01', true, '2026-11-09')).toBeNull();
    expect(sinalDoPrazo(null, false, '2026-11-09')).toBeNull();
  });
});

describe('progresso e datas', () => {
  it('conta as concluídas', () => {
    expect(progresso([{ status: 'concluida' }, { status: 'a_fazer' }, { status: 'concluida' }, { status: 'em_revisao' }])).toEqual({ feitas: 2, total: 4, pct: 50 });
    expect(progresso([])).toEqual({ feitas: 0, total: 0, pct: 0 });
  });

  it('data curta', () => {
    expect(dataCurta('2026-11-09')).toBe('09/11');
    expect(dataCurta(null)).toBe('—');
  });
});

describe('árvore, faixas e arquivos', () => {
  it('acha todos os descendentes', () => {
    const itens = [
      { id: 'p', item_pai_id: null },
      { id: 'a', item_pai_id: 'p' },
      { id: 'b', item_pai_id: 'p' },
      { id: 'a1', item_pai_id: 'a' },
      { id: 'x', item_pai_id: null },
    ];
    expect(descendentes('p', itens).sort()).toEqual(['a', 'a1', 'b']);
    expect(descendentes('a1', itens)).toEqual([]);
  });

  it('faixas das etapas encadeiam do início do projeto', () => {
    expect(faixasDasEtapas({ ...prazos, data_inicio: '2026-11-01' }).map((f) => [f.de, f.ate])).toEqual([
      ['2026-11-01', '2026-11-05'],
      ['2026-11-06', '2026-11-10'],
      ['2026-11-11', '2026-11-20'],
      ['2026-11-21', '2026-11-30'],
    ]);
  });

  it('reconhece o tipo do arquivo', () => {
    expect(tipoDoArquivo('briefing.pdf', null)).toBe('pdf');
    expect(tipoDoArquivo('roteiro.docx', null)).toBe('documento');
    expect(tipoDoArquivo('foto.JPG', null)).toBe('imagem');
    expect(tipoDoArquivo('reels.mov', 'video/quicktime')).toBe('video');
    expect(tipoDoArquivo('dados.xlsx', null)).toBe('planilha');
  });
});
