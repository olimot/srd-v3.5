import modifyHtmls from './modifyHtmls';

const sanitizeMsWordHtml = async () => {
  await modifyHtmls('./.cache/original-html', './.cache/sanitized-html', () => {
    const defaultStyle = document.createElement('style');
    defaultStyle.innerHTML = `table, table * { border-collapse: collapse }`;
    document.head.append(defaultStyle);

    // 1. Traverse nodes and set font style of parent elements of all text nodes
    const dummy = document.createElement('span');
    document.body.appendChild(dummy);
    const dummyStyle = window.getComputedStyle(dummy);
    const stack: Node[] = [window.document.body];
    while (stack.length) {
      const node = stack.pop() as Node;

      if (node.nodeType === 3 && node.parentElement) {
        if (!node.nodeValue?.trim()) {
          let pe: Element | null = node.parentElement;
          pe.removeChild(node);
          while (pe && !pe.childNodes.length && window.getComputedStyle(pe).display === 'inline') {
            const npe: Element | null = pe.parentElement;
            pe.remove();
            pe = npe;
          }
          continue;
        }
        node.parentElement.removeAttribute('lang');

        const style = window.getComputedStyle(node.parentElement);
        const diffStyle = Object.entries(style)
          .filter(([key]) => Number.isNaN(parseInt(key, 10)))
          .reduce((p, [k, v]) => (dummyStyle[k as any] === v ? p : { ...p, [k]: v }), {});

        node.parentElement.removeAttribute('class');
        node.parentElement.removeAttribute('style');

        Object.assign(node.parentElement.style, diffStyle);
      }

      // eslint-disable-next-line no-plusplus
      if (node.childNodes) for (let i = node.childNodes.length; i-- > 0; ) stack.push(node.childNodes[i]);
    }
    document.body.removeChild(dummy);

    // 2. Change tag names. if its display is 'block', then 'div', else if it is 'inline', then 'span', else keep it.
    const changeTagName = (element: Element, tagName: string, dropAttribute?: boolean) => {
      const newElement = document.createElement(tagName);
      newElement.innerHTML = element.innerHTML;
      if (!dropAttribute)
        for (let i = 0; i < element.attributes.length; i += 1)
          newElement.setAttribute(element.attributes[i].name, element.attributes[i].value);
      element.parentElement?.insertBefore(newElement, element);
      element.remove();
      return newElement as Element;
    };

    const elementStack: Element[] = [document.body];
    while (elementStack.length) {
      let element = elementStack.pop() as Element;

      const style = window.getComputedStyle(element);
      if (style.display === 'inline') element = changeTagName(element, 'span');
      if (
        style.display === 'block' &&
        ['BODY', 'TABLE', 'TBODY', 'THEAD', 'TR', 'TH', 'TD', 'BR'].indexOf(element.tagName) === -1
      ) {
        element = changeTagName(element, 'div', true);
      }

      while (
        element.childNodes.length === 1 &&
        element.childNodes[0].nodeType === 1 &&
        ['BODY', 'TABLE', 'TBODY', 'THEAD', 'TR'].indexOf(element.tagName) === -1 &&
        ['BODY', 'TABLE', 'TBODY', 'THEAD', 'TR', 'TH', 'TD', 'BR'].indexOf(element.children[0].tagName) === -1
      ) {
        const prevStyle = element.getAttribute('style') || '';
        const prevChildStyle = element.children[0].getAttribute('style') || '';
        const newStyle = `${prevStyle && prevStyle.replace(/;?$/, ';')}${prevChildStyle}`;
        if (newStyle) element.setAttribute('style', newStyle);
        element.innerHTML = element.children[0].innerHTML;
      }

      if (!element.childNodes.length) {
        const newstyle = window.getComputedStyle(element);
        if (newstyle.display === 'block') {
          const br = document.createElement('br');
          element.parentElement?.insertBefore(br, element);
          element.remove();
        } else if (newstyle.display === 'inline') {
          element.remove();
        }
      } else {
        // eslint-disable-next-line no-plusplus
        for (let i = element.children.length; i-- > 0; ) elementStack.push(element.children[i]);
      }
    }

    // 3. Set default font style and clear font styles at elements if its same as body.
    window.document.head.innerHTML = `<meta charset="utf-8"><title>${window.document.title}</title><style>table, table * { border-collapse: collapse } body { font: 13.3333px "Times New Roman", serif; }</style>`;
    const df = window.getComputedStyle(document.body);
    window.document.querySelectorAll('[style]').forEach(node => {
      const element = node as HTMLElement;
      const style = window.getComputedStyle(element);

      if (element.tagName === 'TD' || element.tagName === 'TABLE') {
        const { border, borderBottom, padding, width } = style;
        const assignee = Object.entries({ border, borderBottom, width, padding }).reduce((p, [k, v]) => {
          if (!v || typeof v !== 'string') return { ...p, [k]: v };
          const emv = v.replace(/([0-9.]+)px/g, (all, numstr) => {
            const num = parseInt(numstr, 10);
            if (Number.isNaN(num)) return all;
            if (num === 0) return '0';
            return `${(Math.round((1e4 * num) / 13.3333) / 1e4).toString().substr(0, 4)}em`;
          });
          return { ...p, [k]: emv };
        }, {});
        Object.assign(element.style, assignee);
      }

      if (style.fontSize === df.fontSize) element.style.removeProperty('font-size');
      if (style.fontFamily === df.fontFamily) element.style.removeProperty('font-family');
      if (style.fontStyle === df.fontStyle) element.style.removeProperty('font-style');
      if (style.fontVariant === df.fontVariant) element.style.removeProperty('font-variant');
      if (style.fontWeight === df.fontWeight) element.style.removeProperty('font-weight');
      if (style.fontStretch === df.fontStretch) element.style.removeProperty('font-stretch');
      if (style.lineHeight === df.lineHeight) element.style.removeProperty('line-height');
      if (element.tagName !== 'TABLE' && element.style.borderCollapse) element.style.removeProperty('border-collapse');
      if (!element.getAttribute('style')) element.removeAttribute('style');
    });

    window.document.querySelectorAll('tr').forEach(tr => {
      if (tr.getBoundingClientRect().height <= 1) tr.remove();
    });

    window.document.querySelectorAll('table').forEach(table => {
      table.removeAttribute('class');
      if (parseInt(table.style.marginLeft, 10) < 0) table.style.removeProperty('margin-left');
      table.outerHTML = `<div class="table-container">${table.outerHTML}</div>`;
    });
  });
};

export default sanitizeMsWordHtml;
