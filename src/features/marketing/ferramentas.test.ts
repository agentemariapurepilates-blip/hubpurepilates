import { describe, it, expect } from 'vitest';
import { FERRAMENTAS_MARKETING } from './ferramentas';
import { sectionFromPath } from '@/components/layout/Sidebar';

describe('ferramentas do Marketing', () => {
  it('toda ferramenta abre a seção Marketing do menu', () => {
    for (const f of FERRAMENTAS_MARKETING) expect(sectionFromPath(f.href)).toBe('marketing');
  });

  it('não repete endereço', () => {
    const hrefs = FERRAMENTAS_MARKETING.map((f) => f.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});
