// Fetch + strip HTML do guia editorial resumido (Instagram).
// Frontend envia o texto puro pra edge function como bloco cacheado.
export async function fetchGuideText(): Promise<string> {
  const resp = await fetch('/guia-editorial-instagram-resumido.html', { cache: 'force-cache' });
  if (!resp.ok) throw new Error('falha ao baixar guia');
  const html = await resp.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('style, script, link, meta, noscript').forEach((el) => el.remove());
  const raw = doc.body?.textContent ?? '';
  return raw.replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n\n').trim();
}
