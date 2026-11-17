// Feriados de 2027 (17/11/2026): um modelo por data, cada um com a ilustração do
// tema (máscara de Carnaval, fogos de Ano-Novo, árvore de Natal…), desenhada aqui
// em SVG nas cores da paleta Pure Studio.
//
// Todos têm o mesmo esqueleto: fundo da cor do tema, ilustração na parte de cima,
// etiqueta ("Feriado") e logo no alto, e um cartão creme
// embaixo com a data, o nome do feriado, a mensagem e um horário opcional (para
// a unidade que abre em horário especial). Tudo editável no Pure Design.

import type { PureDesignTemplate, TemplateField } from './pureDesignTemplates';
import { CREME, GRAFITE, H, VERMELHO, W, cabeca, campoLogo, pilula } from './pureDesignModelosNovos';

// Paleta Pure Studio
const C = {
  vermelho: '#c10230',
  grafite: '#231f20',
  cinza: '#a9a9ab',
  cinzaClaro: '#dbdbdb',
  azul: '#23b2ba',
  malva: '#806873',
  roxo: '#a2268d',
  verde: '#aac338',
  laranja: '#db9828',
  creme: CREME,
};

// ── Peças de desenho ─────────────────────────────────────────────────────────

/** Números "aleatórios" fixos (a mesma arte sempre sai igual). */
function sorteio(semente: number) {
  let s = semente;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const confetes = (semente: number, qtd: number, cores: string[], area = { x: 0, y: 0, w: W, h: 760 }) => {
  const r = sorteio(semente);
  let out = '';
  for (let i = 0; i < qtd; i++) {
    const x = area.x + r() * area.w;
    const y = area.y + r() * area.h;
    const cor = cores[Math.floor(r() * cores.length)];
    const giro = Math.round(r() * 180);
    out +=
      r() > 0.5
        ? `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="22" height="10" rx="3" fill="${cor}" transform="rotate(${giro} ${x.toFixed(0)} ${y.toFixed(0)})"/>`
        : `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(5 + r() * 5).toFixed(1)}" fill="${cor}"/>`;
  }
  return out;
};

/** Fogos de artifício: raios saindo do centro, com bolinhas na ponta. */
const fogos = (cx: number, cy: number, raio: number, cor: string, raios = 14) => {
  let out = '';
  for (let i = 0; i < raios; i++) {
    const a = (i / raios) * Math.PI * 2;
    const x1 = cx + Math.cos(a) * raio * 0.3;
    const y1 = cy + Math.sin(a) * raio * 0.3;
    const x2 = cx + Math.cos(a) * raio;
    const y2 = cy + Math.sin(a) * raio;
    out += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${cor}" stroke-width="6" stroke-linecap="round"/>`;
    out += `<circle cx="${(cx + Math.cos(a) * raio * 1.12).toFixed(1)}" cy="${(cy + Math.sin(a) * raio * 1.12).toFixed(1)}" r="5" fill="${cor}"/>`;
  }
  return out;
};

const estrela = (cx: number, cy: number, r: number, cor: string) => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="${cor}"/>`;
};

const brilho = (cx: number, cy: number, r: number, cor: string) =>
  `<path d="M ${cx} ${cy - r} Q ${cx} ${cy} ${cx + r} ${cy} Q ${cx} ${cy} ${cx} ${cy + r} Q ${cx} ${cy} ${cx - r} ${cy} Q ${cx} ${cy} ${cx} ${cy - r} Z" fill="${cor}"/>`;

const engrenagem = (cx: number, cy: number, r: number, dentes: number, cor: string, furo: string) => {
  const pts: string[] = [];
  const passos = dentes * 4;
  for (let i = 0; i < passos; i++) {
    const a = (i / passos) * Math.PI * 2;
    const rr = i % 4 < 2 ? r : r * 0.8;
    pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="${cor}" stroke="${cor}" stroke-width="6" stroke-linejoin="round"/><circle cx="${cx}" cy="${cy}" r="${r * 0.35}" fill="${furo}"/>`;
};

/** Espiga de trigo inclinada. */
const espiga = (x: number, y: number, giro: number, cor: string) => {
  let graos = '';
  for (let i = 0; i < 7; i++) {
    const gy = -40 - i * 34;
    graos += `<ellipse cx="-16" cy="${gy}" rx="12" ry="24" fill="${cor}" transform="rotate(-28 -16 ${gy})"/>`;
    graos += `<ellipse cx="16" cy="${gy}" rx="12" ry="24" fill="${cor}" transform="rotate(28 16 ${gy})"/>`;
  }
  return `<g transform="translate(${x} ${y}) rotate(${giro})"><line x1="0" y1="140" x2="0" y2="-280" stroke="${cor}" stroke-width="6" stroke-linecap="round"/>${graos}<ellipse cx="0" cy="-286" rx="11" ry="24" fill="${cor}"/></g>`;
};

/** Ramo de louro (metade de uma coroa). */
const louro = (cx: number, cy: number, r: number, lado: 1 | -1, cor: string) => {
  let folhas = '';
  for (let i = 0; i < 9; i++) {
    const a = Math.PI / 2 + lado * (0.25 + i * 0.3);
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    const giro = (a * 180) / Math.PI + (lado === 1 ? 60 : -60);
    folhas += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="15" ry="34" fill="${cor}" transform="rotate(${giro.toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
  }
  return folhas;
};

const flor = (cx: number, cy: number, r: number, petala: string, miolo: string) => {
  let p = '';
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    p += `<circle cx="${(cx + Math.cos(a) * r).toFixed(1)}" cy="${(cy + Math.sin(a) * r).toFixed(1)}" r="${r * 0.75}" fill="${petala}"/>`;
  }
  return `${p}<circle cx="${cx}" cy="${cy}" r="${r * 0.6}" fill="${miolo}"/>`;
};

const enfeite = (x: number, fio: number, r: number, cor: string, fioCor: string) =>
  `<line x1="${x}" y1="0" x2="${x}" y2="${fio}" stroke="${fioCor}" stroke-width="3"/><rect x="${x - 12}" y="${fio - 4}" width="24" height="16" rx="3" fill="${C.laranja}"/><circle cx="${x}" cy="${fio + 12 + r}" r="${r}" fill="${cor}"/><path d="M ${x - r * 0.55} ${fio + 12 + r * 0.6} Q ${x - r * 0.7} ${fio + 12 + r} ${x - r * 0.45} ${fio + 12 + r * 1.4}" stroke="rgba(255,255,255,.55)" stroke-width="6" fill="none" stroke-linecap="round"/>`;

const presente = (x: number, y: number, w: number, h: number, cor: string, fita: string) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${cor}"/><rect x="${x - 10}" y="${y - 34}" width="${w + 20}" height="44" rx="8" fill="${cor}"/><rect x="${x + w / 2 - 14}" y="${y - 34}" width="28" height="${h + 34}" fill="${fita}"/><ellipse cx="${x + w / 2 - 34}" cy="${y - 52}" rx="36" ry="20" fill="none" stroke="${fita}" stroke-width="12" transform="rotate(-25 ${x + w / 2 - 34} ${y - 52})"/><ellipse cx="${x + w / 2 + 34}" cy="${y - 52}" rx="36" ry="20" fill="none" stroke="${fita}" stroke-width="12" transform="rotate(25 ${x + w / 2 + 34} ${y - 52})"/>`;

const arvore = (cx: number, base: number, cor: string) =>
  `<rect x="${cx - 26}" y="${base - 10}" width="52" height="70" rx="6" fill="#7a4b2a"/>
  <polygon points="${cx},${base - 520} ${cx - 150},${base - 300} ${cx + 150},${base - 300}" fill="${cor}"/>
  <polygon points="${cx},${base - 420} ${cx - 210},${base - 150} ${cx + 210},${base - 150}" fill="${cor}"/>
  <polygon points="${cx},${base - 300} ${cx - 270},${base} ${cx + 270},${base}" fill="${cor}"/>
  ${estrela(cx, base - 540, 52, C.laranja)}
  <circle cx="${cx - 60}" cy="${base - 330}" r="16" fill="${C.vermelho}"/><circle cx="${cx + 70}" cy="${base - 250}" r="16" fill="${C.laranja}"/>
  <circle cx="${cx - 110}" cy="${base - 180}" r="16" fill="#ffffff"/><circle cx="${cx + 30}" cy="${base - 120}" r="16" fill="${C.vermelho}"/>
  <circle cx="${cx + 160}" cy="${base - 40}" r="16" fill="#ffffff"/><circle cx="${cx - 170}" cy="${base - 50}" r="16" fill="${C.laranja}"/>
  <circle cx="${cx - 10}" cy="${base - 430}" r="14" fill="#ffffff"/>`;

const taca = (x: number, y: number, giro: number, cor: string) =>
  `<g transform="translate(${x} ${y}) rotate(${giro})"><path d="M -70 -260 L 70 -260 Q 74 -110 0 -70 Q -74 -110 -70 -260 Z" fill="${cor}" opacity=".9"/><path d="M -62 -200 L 62 -200 Q 60 -112 0 -80 Q -60 -112 -62 -200 Z" fill="${C.laranja}"/><rect x="-5" y="-72" width="10" height="150" fill="${cor}"/><ellipse cx="0" cy="80" rx="60" ry="12" fill="${cor}"/><circle cx="-20" cy="-170" r="6" fill="#fff" opacity=".8"/><circle cx="15" cy="-140" r="4" fill="#fff" opacity=".8"/><circle cx="-5" cy="-120" r="5" fill="#fff" opacity=".8"/></g>`;

const mascara = (cx: number, cy: number, escala: number, cor: string, furo: string, enfeiteCor: string) =>
  `<g transform="translate(${cx} ${cy}) scale(${escala}) rotate(-8)">
  <path d="M 230 -40 C 300 -200 380 -250 420 -230 C 380 -180 330 -110 300 -30 Z" fill="${C.verde}"/>
  <path d="M 250 -30 C 340 -170 430 -190 470 -150 C 410 -120 350 -70 310 -10 Z" fill="${C.azul}"/>
  <path d="M 260 -20 C 360 -110 450 -100 480 -60 C 410 -50 350 -20 310 10 Z" fill="${C.laranja}"/>
  <path d="M -300 0 C -290 -110 -140 -140 0 -60 C 140 -140 290 -110 300 0 C 280 110 140 130 0 60 C -140 130 -280 110 -300 0 Z" fill="${cor}"/>
  <ellipse cx="-135" cy="-5" rx="78" ry="44" fill="${furo}" transform="rotate(8 -135 -5)"/>
  <ellipse cx="135" cy="-5" rx="78" ry="44" fill="${furo}" transform="rotate(-8 135 -5)"/>
  <path d="M -300 0 C -290 -110 -140 -140 0 -60 C 140 -140 290 -110 300 0" fill="none" stroke="${enfeiteCor}" stroke-width="10" stroke-dasharray="2 22" stroke-linecap="round"/>
  <circle cx="0" cy="-20" r="16" fill="${enfeiteCor}"/>
  <path d="M 290 30 Q 340 140 300 260" stroke="${enfeiteCor}" stroke-width="8" fill="none" stroke-linecap="round"/>
  </g>`;

const serpentina = (x: number, y: number, cor: string, giro = 0) =>
  `<path d="M ${x} ${y} q 40 -50 80 0 t 80 0 t 80 0 t 80 0" stroke="${cor}" stroke-width="9" fill="none" stroke-linecap="round" transform="rotate(${giro} ${x} ${y})"/>`;

const vela = (cx: number, base: number, alt: number) =>
  `<circle cx="${cx}" cy="${base - alt - 50}" r="110" fill="${C.laranja}" opacity=".18"/>
  <circle cx="${cx}" cy="${base - alt - 50}" r="60" fill="${C.laranja}" opacity=".25"/>
  <rect x="${cx - 42}" y="${base - alt}" width="84" height="${alt}" rx="10" fill="#f6efe2"/>
  <path d="M ${cx - 42} ${base - alt + 30} q 20 18 40 0 v 50 q -20 12 -40 -4 Z" fill="#e9dcc6"/>
  <line x1="${cx}" y1="${base - alt}" x2="${cx}" y2="${base - alt - 18}" stroke="${GRAFITE}" stroke-width="4"/>
  <path d="M ${cx} ${base - alt - 100} C ${cx + 32} ${base - alt - 60} ${cx + 26} ${base - alt - 22} ${cx} ${base - alt - 18} C ${cx - 26} ${base - alt - 22} ${cx - 32} ${base - alt - 60} ${cx} ${base - alt - 100} Z" fill="${C.laranja}"/>
  <path d="M ${cx} ${base - alt - 70} C ${cx + 14} ${base - alt - 50} ${cx + 10} ${base - alt - 28} ${cx} ${base - alt - 24} C ${cx - 10} ${base - alt - 28} ${cx - 14} ${base - alt - 50} ${cx} ${base - alt - 70} Z" fill="#fff3c4"/>`;

const bandeiraBrasil = (cx: number, cy: number, w: number) => {
  const h = w * 0.7;
  const x = cx - w / 2;
  const y = cy - h / 2;
  const r = h * 0.25;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="#009c3b"/>
  <polygon points="${cx},${y + h * 0.085} ${x + w * 0.94},${cy} ${cx},${y + h * 0.915} ${x + w * 0.06},${cy}" fill="#ffdf00"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="#002776"/>
  <clipPath id="globo"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>
  <path d="M ${cx - r * 1.2} ${cy + r * 0.05} Q ${cx} ${cy - r * 0.55} ${cx + r * 1.2} ${cy + r * 0.45}" stroke="#ffffff" stroke-width="${r * 0.18}" fill="none" clip-path="url(#globo)"/>
  ${estrela(cx - r * 0.4, cy + r * 0.45, 7, '#fff')}${estrela(cx + r * 0.2, cy + r * 0.6, 7, '#fff')}${estrela(cx + r * 0.5, cy + r * 0.25, 6, '#fff')}${estrela(cx - r * 0.1, cy + r * 0.3, 5, '#fff')}`;
};

// ── Ilustrações (área de cima, 1080 x ~780) ──────────────────────────────────
type Ilustracao = { fundo: string; escuro: boolean; svg: string };

const ILUSTRACOES: Record<string, Ilustracao> = {
  'ano-novo': {
    fundo: C.grafite,
    escuro: true,
    svg: `${fogos(250, 330, 150, C.laranja)}${fogos(830, 280, 120, C.vermelho)}${fogos(560, 200, 80, C.azul, 12)}${fogos(975, 735, 55, C.verde, 10)}
    <text x="540" y="640" text-anchor="middle" font-family="Montserrat" font-weight="800" font-size="230" fill="none" stroke="${C.laranja}" stroke-width="5" letter-spacing="8">2027</text>
    ${brilho(140, 620, 22, '#fff')}${brilho(980, 140, 18, '#fff')}${brilho(420, 140, 14, '#fff')}${brilho(700, 470, 12, '#fff')}`,
  },
  carnaval: {
    fundo: C.roxo,
    escuro: true,
    svg: `${confetes(7, 70, [C.laranja, C.verde, C.azul, '#ffffff', C.vermelho])}
    ${serpentina(40, 180, C.laranja, 15)}${serpentina(700, 120, C.verde, -10)}${serpentina(760, 680, C.azul, 8)}${serpentina(20, 640, '#ffffff', -12)}
    ${mascara(500, 420, 1, C.laranja, C.roxo, '#ffffff')}`,
  },
  cinzas: {
    fundo: C.creme,
    escuro: false,
    svg: `${confetes(11, 30, [C.cinza, C.cinzaClaro, C.malva])}${mascara(540, 420, 0.75, C.cinzaClaro, C.creme, C.cinza)}
    ${serpentina(80, 660, C.cinzaClaro, -8)}`,
  },
  'sexta-santa': {
    fundo: C.malva,
    escuro: true,
    svg: `${Array.from({ length: 16 }, (_, i) => {
      const a = (i / 16) * Math.PI * 2;
      return `<line x1="540" y1="420" x2="${(540 + Math.cos(a) * 420).toFixed(0)}" y2="${(420 + Math.sin(a) * 420).toFixed(0)}" stroke="#ffffff" stroke-width="3" opacity=".18"/>`;
    }).join('')}
    <circle cx="540" cy="420" r="230" fill="#ffffff" opacity=".08"/>
    <rect x="515" y="190" width="50" height="470" rx="10" fill="#f8f3e8"/><rect x="410" y="300" width="260" height="50" rx="10" fill="#f8f3e8"/>`,
  },
  tiradentes: {
    fundo: C.creme,
    escuro: false,
    svg: `<rect x="230" y="200" width="620" height="440" rx="10" fill="#ffffff" stroke="${C.cinzaClaro}" stroke-width="4"/>
    <polygon points="540,265 700,555 380,555" fill="none" stroke="${C.vermelho}" stroke-width="52" stroke-linejoin="miter"/>
    <path id="lema" d="M 330 610 L 540 230 L 750 610" fill="none"/>
    <text font-family="Montserrat" font-weight="700" font-size="22" fill="#ffffff" letter-spacing="3" dominant-baseline="middle"><textPath href="#lema" startOffset="50%" text-anchor="middle">LIBERTAS QUÆ SERA TAMEN</textPath></text>
    <rect x="215" y="180" width="14" height="560" rx="7" fill="#7a4b2a"/>`,
  },
  trabalho: {
    fundo: C.azul,
    escuro: true,
    svg: `${engrenagem(420, 400, 190, 12, '#ffffff', C.azul)}${engrenagem(690, 250, 120, 9, C.grafite, C.azul)}${engrenagem(720, 560, 95, 8, C.laranja, C.azul)}
    ${brilho(170, 200, 20, '#fff')}${brilho(920, 680, 16, '#fff')}`,
  },
  'corpus-christi': {
    fundo: C.creme,
    escuro: false,
    svg: `${Array.from({ length: 20 }, (_, i) => {
      const a = (i / 20) * Math.PI * 2;
      return `<line x1="${(540 + Math.cos(a) * 130).toFixed(0)}" y1="${(330 + Math.sin(a) * 130).toFixed(0)}" x2="${(540 + Math.cos(a) * 210).toFixed(0)}" y2="${(330 + Math.sin(a) * 210).toFixed(0)}" stroke="${C.laranja}" stroke-width="6" stroke-linecap="round"/>`;
    }).join('')}
    <circle cx="540" cy="330" r="105" fill="#ffffff" stroke="${C.laranja}" stroke-width="8"/>
    ${espiga(300, 560, -25, C.laranja)}${espiga(780, 560, 25, C.laranja)}`,
  },
  'revolucao-constitucionalista': {
    fundo: C.creme,
    escuro: false,
    svg: `<g transform="translate(220 200)">
    ${Array.from({ length: 13 }, (_, i) => `<rect x="0" y="${i * 34}" width="640" height="34" fill="${i % 2 ? '#ffffff' : C.grafite}"/>`).join('')}
    <rect x="0" y="0" width="250" height="170" fill="${C.vermelho}"/>
    <circle cx="125" cy="85" r="52" fill="#ffffff"/><circle cx="125" cy="85" r="30" fill="${C.grafite}"/>
    ${estrela(32, 30, 12, '#fff')}${estrela(218, 30, 12, '#fff')}${estrela(32, 140, 12, '#fff')}${estrela(218, 140, 12, '#fff')}
    </g><rect x="205" y="180" width="14" height="560" rx="7" fill="#7a4b2a"/>`,
  },
  independencia: {
    fundo: C.creme,
    escuro: false,
    svg: `${bandeiraBrasil(540, 420, 640)}${confetes(23, 26, ['#009c3b', '#ffdf00', '#002776'], { x: 0, y: 120, w: W, h: 640 })}`,
  },
  aparecida: {
    fundo: '#23356b',
    escuro: true,
    svg: `<path d="M 540 210 C 640 210 690 300 700 400 C 715 520 780 640 800 720 L 280 720 C 300 640 365 520 380 400 C 390 300 440 210 540 210 Z" fill="#3a5bb0"/>
    <path d="M 540 260 C 600 260 630 320 636 390 C 645 480 690 600 700 720 L 380 720 C 390 600 435 480 444 390 C 450 320 480 260 540 260 Z" fill="#2c4a96"/>
    <circle cx="540" cy="330" r="58" fill="#7a4b2a"/>
    <path d="M 470 230 L 490 170 L 515 210 L 540 150 L 565 210 L 590 170 L 610 230 Z" fill="${C.laranja}"/>
    ${[...Array(9)].map((_, i) => estrela(330 + (i % 3) * 210 + (i > 2 ? 40 : 0), 470 + Math.floor(i / 3) * 90, 12, C.laranja)).join('')}
    ${brilho(170, 220, 20, '#fff')}${brilho(910, 300, 16, '#fff')}${brilho(880, 620, 12, '#fff')}`,
  },
  finados: {
    fundo: C.malva,
    escuro: true,
    svg: `${vela(540, 640, 260)}${vela(380, 660, 170)}${vela(700, 660, 200)}
    ${flor(230, 640, 22, '#f8f3e8', C.laranja)}${flor(860, 630, 26, '#f8f3e8', C.laranja)}${flor(150, 580, 16, '#dbdbdb', C.laranja)}`,
  },
  republica: {
    fundo: C.creme,
    escuro: false,
    svg: `${louro(540, 410, 230, 1, '#009c3b')}${louro(540, 410, 230, -1, '#009c3b')}
    <circle cx="540" cy="410" r="150" fill="#002776"/>
    ${estrela(540, 400, 90, '#ffdf00')}
    <path d="M 470 650 Q 540 690 610 650" stroke="#009c3b" stroke-width="10" fill="none" stroke-linecap="round"/>`,
  },
  'consciencia-negra': {
    fundo: C.grafite,
    escuro: true,
    svg: `<circle cx="540" cy="480" r="200" fill="${C.laranja}"/>
    ${[250, 760].map((y, n) =>
      Array.from({ length: 18 }, (_, i) => {
        const x = i * 62;
        const cor = [C.vermelho, C.laranja, C.verde][(i + n) % 3];
        return `<polygon points="${x},${y} ${x + 31},${y - 52} ${x + 62},${y}" fill="${cor}"/><rect x="${x + 22}" y="${y + 14}" width="18" height="18" fill="${cor}" transform="rotate(45 ${x + 31} ${y + 23})"/>`;
      }).join(''),
    ).join('')}
    <path d="M 540 670 L 540 480 M 540 530 L 440 440 M 540 510 L 650 420 M 540 580 L 460 530 M 540 570 L 620 530" stroke="${C.grafite}" stroke-width="22" stroke-linecap="round"/>
    <ellipse cx="540" cy="390" rx="170" ry="80" fill="${C.grafite}"/>`,
  },
  'vespera-natal': {
    fundo: C.vermelho,
    escuro: true,
    svg: `${enfeite(160, 160, 52, '#ffffff', 'rgba(255,255,255,.6)')}${enfeite(360, 280, 64, C.laranja, 'rgba(255,255,255,.6)')}
    ${enfeite(560, 120, 46, C.verde, 'rgba(255,255,255,.6)')}${enfeite(760, 240, 70, '#ffffff', 'rgba(255,255,255,.6)')}${enfeite(940, 140, 44, C.laranja, 'rgba(255,255,255,.6)')}
    ${brilho(250, 560, 22, '#fff')}${brilho(650, 520, 18, '#fff')}${brilho(900, 520, 26, '#fff')}${brilho(480, 640, 14, '#fff')}`,
  },
  natal: {
    fundo: '#1f5a43',
    escuro: true,
    svg: `${arvore(420, 700, '#2f8a5f')}${presente(700, 560, 150, 140, C.vermelho, C.laranja)}${presente(870, 610, 110, 90, '#ffffff', C.vermelho)}
    ${brilho(820, 250, 22, '#fff')}${brilho(160, 300, 18, '#fff')}${brilho(940, 420, 14, '#fff')}${confetes(3, 24, ['#ffffff'], { x: 0, y: 110, w: W, h: 560 })}`,
  },
  'vespera-ano-novo': {
    fundo: C.grafite,
    escuro: true,
    svg: `${fogos(220, 260, 120, C.laranja)}${fogos(870, 230, 100, C.azul)}${fogos(560, 160, 60, C.vermelho, 10)}
    ${taca(470, 640, -14, '#f8f3e8')}${taca(610, 640, 14, '#f8f3e8')}
    ${brilho(540, 360, 26, C.laranja)}${confetes(5, 40, [C.laranja, '#ffffff', C.vermelho], { x: 0, y: 120, w: W, h: 640 })}`,
  },
};

// ── Esqueleto ────────────────────────────────────────────────────────────────
function feriado(chave: string): string {
  const il = ILUSTRACOES[chave];
  return `${cabeca('Feriado')}
<div style="position:relative; width:${W}px; height:${H}px; background:${il.fundo}; overflow:hidden; font-family:Montserrat, sans-serif;">
<svg width="${W}" height="800" viewBox="0 0 ${W} 800" style="position:absolute; left:0; top:0;">${il.svg}</svg>
<!--fld:selo--><div class="pd-bloco" style="position:absolute; left:80px; top:80px;">${pilula('{{selo}}', il.escuro ? '#ffffff' : VERMELHO, il.escuro ? il.fundo : '#f7efe3')}</div><!--/fld:selo-->
<img src="{{logo}}" alt="" style="{{logo:estilo}}"/>
<div style="position:absolute; left:80px; bottom:80px; width:920px; box-sizing:border-box; padding:44px 56px 46px; border-radius:36px 36px 0 36px; background:${CREME}; color:${VERMELHO};">
<div class="pd-vazio" style="font-size:24px; font-weight:500; letter-spacing:3px; text-transform:uppercase; margin-bottom:14px;">{{data}}</div>
<div style="font-size:60px; font-weight:300; line-height:1.08; white-space:pre-line;">{{titulo}}</div>
<div class="pd-vazio" style="margin-top:18px; font-size:27px; font-weight:300; line-height:1.45; color:${GRAFITE}; white-space:pre-line;">{{mensagem}}</div>
<!--fld:horario--><div class="pd-bloco" style="margin-top:24px; padding-top:22px; border-top:2px solid rgba(193,32,48,.35);"><div class="pd-vazio" style="font-size:26px; font-weight:700;">{{horario}}</div></div><!--/fld:horario-->
</div>
</div>
</body>
</html>`;
}

type Dados = {
  id: string;
  chave: string;
  nome: string;
  selo: string;
  data: string;
  titulo: string;
  mensagem: string;
  horario?: string;
  palavras: string[];
};

const FECHADO = 'Neste dia a unidade estará fechada.\nAproveite para descansar e até a próxima aula!';

const DADOS: Dados[] = [
  { id: 'confraternizacao', chave: 'ano-novo', nome: 'Confraternização Universal (01/01)', selo: 'Feriado', data: '01 de janeiro · sexta-feira', titulo: 'Feliz **2027**!', mensagem: 'Neste dia a unidade estará fechada.\nQue o novo ano venha cheio de movimento!', palavras: ['ano novo', 'confraternizacao', '1 de janeiro', 'primeiro de janeiro', 'janeiro', '2027'] },
  { id: 'carnaval', chave: 'carnaval', nome: 'Carnaval (08 e 09/02)', selo: '', data: '08 e 09 de fevereiro', titulo: 'É **Carnaval**!', mensagem: 'Nos dias de folia a unidade estará fechada.\nAproveite e volte com tudo!', palavras: ['carnaval', 'folia', 'fevereiro'] },
  { id: 'cinzas', chave: 'cinzas', nome: 'Quarta-feira de Cinzas (10/02)', selo: '', data: '10 de fevereiro · quarta-feira', titulo: 'Quarta-feira\nde **Cinzas**', mensagem: 'Depois da folia, a gente volta ao movimento.', horario: 'Voltamos às 14h', palavras: ['cinzas', 'quarta de cinzas', 'quarta-feira de cinzas', 'depois do carnaval'] },
  { id: 'sexta-santa', chave: 'sexta-santa', nome: 'Sexta-feira Santa (26/03)', selo: 'Feriado', data: '26 de março · sexta-feira', titulo: 'Sexta-feira\n**Santa**', mensagem: 'Neste dia a unidade estará fechada.\nDesejamos uma Páscoa de paz e renovação.', palavras: ['sexta-feira santa', 'sexta santa', 'paixao de cristo', 'pascoa', 'semana santa'] },
  { id: 'tiradentes', chave: 'tiradentes', nome: 'Tiradentes (21/04)', selo: 'Feriado', data: '21 de abril · quarta-feira', titulo: '**Tiradentes**', mensagem: FECHADO, palavras: ['tiradentes', '21 de abril', 'abril'] },
  { id: 'trabalho', chave: 'trabalho', nome: 'Dia do Trabalho (01/05)', selo: 'Feriado', data: '01 de maio · sábado', titulo: 'Dia do\n**Trabalho**', mensagem: 'Neste dia a unidade estará fechada.\nUma homenagem a todos que fazem acontecer!', palavras: ['dia do trabalho', 'dia do trabalhador', '1 de maio', 'primeiro de maio'] },
  { id: 'corpus-christi', chave: 'corpus-christi', nome: 'Corpus Christi (27/05)', selo: '', data: '27 de maio · quinta-feira', titulo: '**Corpus Christi**', mensagem: FECHADO, palavras: ['corpus christi', 'corpus'] },
  { id: 'revolucao-constitucionalista', chave: 'revolucao-constitucionalista', nome: 'Revolução Constitucionalista — SP (09/07)', selo: 'Feriado em SP', data: '09 de julho · sexta-feira', titulo: 'Revolução\n**Constitucionalista**', mensagem: FECHADO, palavras: ['revolucao constitucionalista', '9 de julho', 'nove de julho', 'feriado de sao paulo', 'feriado estadual'] },
  { id: 'independencia', chave: 'independencia', nome: 'Independência do Brasil (07/09)', selo: 'Feriado', data: '07 de setembro · terça-feira', titulo: 'Independência\ndo **Brasil**', mensagem: FECHADO, palavras: ['independencia', '7 de setembro', 'sete de setembro'] },
  { id: 'aparecida', chave: 'aparecida', nome: 'Nossa Senhora Aparecida (12/10)', selo: 'Feriado', data: '12 de outubro · terça-feira', titulo: 'Nossa Senhora\n**Aparecida**', mensagem: FECHADO, palavras: ['nossa senhora aparecida', 'aparecida', '12 de outubro', 'padroeira'] },
  { id: 'finados', chave: 'finados', nome: 'Finados (02/11)', selo: 'Feriado', data: '02 de novembro · terça-feira', titulo: 'Dia de **Finados**', mensagem: 'Neste dia a unidade estará fechada.\nUm dia para lembrar com carinho de quem amamos.', palavras: ['finados', 'dia de finados', '2 de novembro'] },
  { id: 'republica', chave: 'republica', nome: 'Proclamação da República (15/11)', selo: 'Feriado', data: '15 de novembro · segunda-feira', titulo: 'Proclamação\nda **República**', mensagem: FECHADO, palavras: ['proclamacao da republica', 'republica', '15 de novembro'] },
  { id: 'consciencia-negra', chave: 'consciencia-negra', nome: 'Consciência Negra (20/11)', selo: 'Feriado', data: '20 de novembro · sábado', titulo: 'Dia da\n**Consciência Negra**', mensagem: 'Neste dia a unidade estará fechada.\nRespeito, memória e igualdade todos os dias.', palavras: ['consciencia negra', 'zumbi', '20 de novembro'] },
  { id: 'vespera-natal', chave: 'vespera-natal', nome: 'Véspera de Natal (24/12)', selo: '', data: '24 de dezembro · sexta-feira', titulo: 'Véspera\nde **Natal**', mensagem: 'Hoje encerramos mais cedo para celebrar com quem amamos.', horario: 'Aberto até as 14h', palavras: ['vespera de natal', 'noite de natal', '24 de dezembro', 'natal'] },
  { id: 'natal', chave: 'natal', nome: 'Natal (25/12)', selo: 'Feriado', data: '25 de dezembro · sábado', titulo: 'Feliz **Natal**!', mensagem: 'Neste dia a unidade estará fechada.\nQue seja um Natal cheio de afeto e leveza.', palavras: ['natal', '25 de dezembro', 'feliz natal'] },
  { id: 'vespera-ano-novo', chave: 'vespera-ano-novo', nome: 'Véspera de Ano-Novo (31/12)', selo: '', data: '31 de dezembro · sexta-feira', titulo: 'Até já,\n**2027**!', mensagem: 'Hoje a unidade fecha mais cedo.\nObrigado por fazer parte do nosso ano!', horario: 'Aberto até as 12h', palavras: ['reveillon', 'vespera de ano novo', 'ultimo dia do ano', '31 de dezembro', 'ano novo'] },
];

const campos = (d: Dados, escuro: boolean): TemplateField[] => [
  { id: 'selo', label: 'Etiqueta (opcional)', placeholder: '{{selo}}', defaultValue: d.selo, maxLength: 22 },
  { id: 'data', label: 'Data', placeholder: '{{data}}', defaultValue: d.data, maxLength: 40 },
  { id: 'titulo', label: 'Título (use **assim** para negrito)', placeholder: '{{titulo}}', defaultValue: d.titulo, inputType: 'textarea', maxLength: 50 },
  { id: 'mensagem', label: 'Mensagem', placeholder: '{{mensagem}}', defaultValue: d.mensagem, inputType: 'textarea', maxLength: 140 },
  { id: 'horario', label: 'Horário especial (opcional)', placeholder: '{{horario}}', defaultValue: d.horario ?? '', maxLength: 50 },
  campoLogo(escuro, 790, 84, 210),
];

export const FERIADOS_2027: PureDesignTemplate[] = DADOS.map((d) => ({
  id: `feriado-2027-${d.id}`,
  name: d.nome,
  category: 'Feriados 2027',
  thumbnail: `/images/pure-design/feriado-2027-${d.id}.jpg`,
  width: W,
  height: H,
  html: feriado(d.chave),
  fields: campos(d, ILUSTRACOES[d.chave].escuro),
}));

export const PALAVRAS_FERIADOS_2027: Record<string, string[]> = Object.fromEntries(
  DADOS.map((d) => [`feriado-2027-${d.id}`, ['feriado', 'feriado 2027', ...d.palavras]]),
);

export const DICAS_FERIADOS_2027: Record<string, string> = Object.fromEntries(
  DADOS.map((d) => [
    `feriado-2027-${d.id}`,
    `Aviso do feriado ${d.nome} de 2027, com ilustração do tema. Data já preenchida; mensagem de fechado e horário especial opcional. Prefira este ao aviso de feriado genérico quando o pedido for desta data.`,
  ]),
);
