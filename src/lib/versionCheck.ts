// Auto-atualização — garante que os usuários rodem sempre a versão mais recente
// publicada, sem precisar limpar cache / dar hard refresh na mão.
//
// Por que isso é necessário: o Hub fica atrás do Cloudflare e os assets são
// cacheados. Depois de um deploy, um navegador que já tinha o app aberto (ou o
// index.html cacheado) pode continuar numa versão antiga. Isto resolve sem
// service worker e sem dependência nova.
//
// Estratégia:
//  1) Guarda o hash do bundle de entrada carregado agora (lido do <script> do
//     index.html — só existe no build de produção; em dev é /src/main.tsx e a
//     checagem simplesmente não roda).
//  2) A cada X minutos e quando a aba volta ao foco, busca o index.html com o
//     cache desligado (e query única, pra furar o Cloudflare) e compara o hash.
//     Se mudou, saiu deploy novo → recarrega.
//  3) Também escuta `vite:preloadError` (chunk que sumiu após um deploy) e
//     recarrega na hora.
//
// Trava anti-loop: só recarrega UMA vez por versão detectada (sessionStorage).
// Se após o reload o navegador ainda servir o bundle antigo, não recarrega de
// novo — no pior caso o usuário segue na versão antiga, nunca em loop.

import { toast } from 'sonner';

const ENTRY_RE = /\/app\/index-[A-Za-z0-9_-]+\.js/;
const RELOAD_KEY = 'hub:reloaded-for';
const POLL_MS = 3 * 60 * 1000;

// Hash do bundle de entrada que está rodando agora (null em dev).
function currentEntry(): string | null {
  const el = document.querySelector('script[type="module"][src*="/app/index-"]');
  const src = el?.getAttribute('src');
  if (!src) return null;
  return src.match(ENTRY_RE)?.[0] ?? src;
}

function reloadOnce(version: string) {
  if (sessionStorage.getItem(RELOAD_KEY) === version) return; // já tentamos p/ esta versão
  sessionStorage.setItem(RELOAD_KEY, version);
  try {
    toast('Nova versão disponível — atualizando…');
  } catch {
    /* toaster ainda não montado: tudo bem, o reload acontece mesmo assim */
  }
  window.setTimeout(() => window.location.reload(), 1200);
}

// Lê o index.html mais recente do servidor, furando cache do navegador e do CDN.
async function fetchLatestEntry(): Promise<string | null> {
  try {
    const res = await fetch(`/?_=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const html = await res.text();
    return html.match(ENTRY_RE)?.[0] ?? null;
  } catch {
    return null; // offline / rede instável — ignora
  }
}

async function checkForUpdate() {
  const loaded = currentEntry();
  if (!loaded) return;
  const latest = await fetchLatestEntry();
  if (latest && latest !== loaded) reloadOnce(latest);
}

export function initVersionCheck() {
  if (!currentEntry()) return; // só no build de produção

  // Chunk que sumiu após um deploy → recarrega imediatamente.
  window.addEventListener('vite:preloadError', () => reloadOnce('preload-error'));

  // Checagem periódica + quando a aba volta ao foco (cobre abas deixadas abertas).
  window.setInterval(checkForUpdate, POLL_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkForUpdate();
  });
}
