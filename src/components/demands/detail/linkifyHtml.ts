export const linkifyHtml = (html: string): string => {
  const div = document.createElement('div');
  div.innerHTML = html;

  const walkNode = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      const urlRegex = /(https?:\/\/[^\s<]+)/g;
      if (urlRegex.test(text)) {
        const span = document.createElement('span');
        span.innerHTML = text.replace(urlRegex, '<a href="$1" class="text-primary underline cursor-pointer" target="_blank" rel="noopener noreferrer">$1</a>');
        node.parentNode?.replaceChild(span, node);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName !== 'A') {
      Array.from(node.childNodes).forEach(walkNode);
    }
  };

  Array.from(div.childNodes).forEach(walkNode);
  return div.innerHTML;
};
