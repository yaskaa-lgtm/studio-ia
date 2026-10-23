/** Split the text of an element into word spans (<span class="w"><span>mot</span></span>), keeping inline markup. */
export function splitWords(root: HTMLElement): HTMLElement[] {
  const inners: HTMLElement[] = [];
  const walk = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent ?? '';
        if (!text.trim()) continue;
        const frag = document.createDocumentFragment();
        // split on ordinary whitespace only: non-breaking spaces (before ? : ! ;) stay inside words
        for (const part of text.split(/([ \t\n\r]+)/)) {
          if (!part) continue;
          if (/^[ \t\n\r]+$/.test(part)) {
            frag.append(document.createTextNode(' '));
            continue;
          }
          const w = document.createElement('span');
          w.className = 'w';
          const inner = document.createElement('span');
          inner.textContent = part;
          w.append(inner);
          frag.append(w);
          inners.push(inner);
        }
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        walk(child);
      }
    }
  };
  walk(root);
  return inners;
}
