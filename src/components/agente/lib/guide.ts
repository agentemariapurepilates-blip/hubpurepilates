// Fetch + strip HTML do guia editorial resumido. Default = Instagram.
// Cada agente passa a URL do seu guia (TikTok, IG, etc.).
// Frontend envia o texto puro pra edge function como bloco cacheado.
export const GUIDE_URLS = {
  instagram: '/guia-editorial-instagram-resumido.html',
  tiktok: '/guia-editorial-tiktok-resumido.html',
} as const;

export async function fetchGuideText(url: string = GUIDE_URLS.instagram): Promise<string> {
  const resp = await fetch(url, { cache: 'force-cache' });
  if (!resp.ok) throw new Error('falha ao baixar guia');
  const html = await resp.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('style, script, link, meta, noscript').forEach((el) => el.remove());
  const raw = doc.body?.textContent ?? '';
  return raw.replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n\n').trim();
}
