// A Montserrat é a fonte oficial da marca e nunca pode mudar: todo modelo do
// Pure Design só usa Montserrat e carrega a família inteira (pesos e itálico).
import { describe, expect, it } from 'vitest';
import { pureDesignTemplates } from './pureDesignTemplates';

describe('fonte oficial', () => {
  it('todo modelo usa só Montserrat', () => {
    for (const t of pureDesignTemplates) {
      const familias = [...t.html.matchAll(/font-family\s*[:=]\s*["']?([^;"'>]+)/g)].map((m) => m[1]);
      for (const f of familias) expect(`${t.id}: ${f}`).toMatch(/Montserrat/);
    }
  });

  it('todo modelo carrega a Montserrat inteira', () => {
    for (const t of pureDesignTemplates) {
      expect(`${t.id}: ${t.html}`).toContain('family=Montserrat:ital,wght@0,100..900;1,100..900');
    }
  });
});
