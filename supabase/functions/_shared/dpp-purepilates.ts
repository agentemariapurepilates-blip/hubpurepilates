// Busca lista de unidades Pure Pilates da página pública de coordenadas.
// A página retorna HTML com uma <table>; parseamos as <tr><td>.

const PP_UNITS_URL =
  'https://app.purepilates.com.br/consultar-unidades-e-coordenadas';

export type PPUnit = {
  id: number;
  nome: string;
  latitude: number | null;
  longitude: number | null;
};

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function parseLatLon(raw: string): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/\./g, '').replace(/,/g, '.').trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function parsePPUnitsTable(html: string): PPUnit[] {
  const units: PPUnit[] = [];
  const rowRegex = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRegex = /<td\b[^>]*>([\s\S]*?)<\/td>/gi;
  let rowMatch: RegExpExecArray | null;
  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const inner = rowMatch[1];
    const cells: string[] = [];
    let cellMatch: RegExpExecArray | null;
    cellRegex.lastIndex = 0;
    while ((cellMatch = cellRegex.exec(inner)) !== null) {
      cells.push(cellMatch[1].trim());
    }
    if (cells.length < 4) continue;
    const id = Number(cells[0]);
    if (!Number.isFinite(id)) continue;
    units.push({
      id,
      nome: decodeEntities(cells[1].replace(/<[^>]+>/g, '')).trim(),
      latitude: parseLatLon(cells[2]),
      longitude: parseLatLon(cells[3]),
    });
  }
  return units;
}

export async function fetchPPUnits(): Promise<PPUnit[]> {
  const r = await fetch(PP_UNITS_URL, { cache: 'no-store' });
  if (!r.ok) throw new Error(`Pure Pilates ${r.status}: ${await r.text()}`);
  return parsePPUnitsTable(await r.text());
}
