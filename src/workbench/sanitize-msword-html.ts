import modifyHtmls from './modifyHtmls';

const sanitizeMsWordHtml = async () => {
  await modifyHtmls('./.cache/original-html', './.cache/sanitized-html', () => {
    const keyStyleNames = [
      'fontSize',
      'fontFamily',
      'fontStyle',
      'fontVariant',
      'fontWeight',
      'fontStretch',
      'lineHeight',
      'verticalAlign',
    ] as (keyof CSSStyleDeclaration)[];

    document.querySelectorAll('[lang]').forEach(q => q.removeAttribute('lang'));

    // 1. Traverse nodes and set font style of parent elements of all text nodes
    const stack: Node[] = [window.document.body];
    while (stack.length) {
      const node = stack.pop() as Node;

      if (node.nodeType === 3 && node.parentElement) {
        const element = node.parentElement;
        if (!node.nodeValue?.trim()) {
          let cursor: Element | null = element;
          cursor.removeChild(node);
          while (cursor && !cursor.childNodes.length && window.getComputedStyle(cursor).display === 'inline') {
            const next: Element | null = cursor.parentElement;
            cursor.remove();
            cursor = next;
          }
        } else {
          const computedStyle = window.getComputedStyle(element);
          const style = keyStyleNames.reduce((p, key) => ({ ...p, [key]: computedStyle[key] }), {});
          element.removeAttribute('class');
          element.removeAttribute('style');
          Object.assign(element.style, style);
        }
      }

      if (node.nodeType === 1) {
        const element = node as HTMLElement;
        const style = window.getComputedStyle(element);
        if (style.verticalAlign !== 'baseline') element.style.verticalAlign = style.verticalAlign;
      }

      // eslint-disable-next-line no-plusplus
      if (node.childNodes.length) for (let i = node.childNodes.length; i-- > 0; ) stack.push(node.childNodes[i]);
    }

    // 2. Change tag names. if its display is 'block', then 'div', else if it is 'inline', then 'span', else keep it.
    const changeTagName = <E extends Element>(element: E, tagName: string, dropAttribute?: boolean) => {
      const newElement = document.createElement(tagName);
      newElement.innerHTML = element.innerHTML;
      if (!dropAttribute)
        for (let i = 0; i < element.attributes.length; i += 1)
          newElement.setAttribute(element.attributes[i].name, element.attributes[i].value);
      element.parentElement?.insertBefore(newElement, element);
      element.remove();
      return newElement;
    };

    const elementStack: HTMLElement[] = [document.body];
    while (elementStack.length) {
      let element = elementStack.pop() as HTMLElement;

      const style = window.getComputedStyle(element);
      if (style.display === 'inline') element = changeTagName(element, 'span');

      if (
        style.display === 'block' &&
        ['BODY', 'TABLE', 'TBODY', 'THEAD', 'TR', 'TH', 'TD', 'BR'].indexOf(element.tagName) === -1
      ) {
        const marginLeftCssValue = element.style.marginLeft;
        element = changeTagName(element, 'div', true);
        if (marginLeftCssValue) {
          const marginLeft = parseFloat(marginLeftCssValue) / 10 || 0;
          element.style.marginLeft = `${marginLeft.toFixed(4)}em`;
        }
      }

      // merge downward
      if (['TABLE', 'TBODY', 'THEAD', 'TR'].indexOf(element.tagName) === -1) {
        while (
          element.childNodes.length === 1 &&
          element.childNodes[0].nodeType === 1 &&
          ['BODY', 'TABLE', 'TBODY', 'THEAD', 'TR', 'TH', 'TD', 'BR'].indexOf(element.children[0].tagName) === -1 &&
          (element.tagName !== 'TD' || !(element.children[0] as HTMLElement).style.marginLeft)
        ) {
          const child = element.children[0] as HTMLElement;
          const verticalAlign =
            element.style.verticalAlign !== '' && element.style.verticalAlign !== 'baseline'
              ? element.style.verticalAlign
              : child.style.verticalAlign;
          const valignCssText = verticalAlign ? `vertical-align:${verticalAlign};` : '';
          const cssText = `${element.style.cssText}${child.style.cssText}${valignCssText}`;
          element.style.cssText = cssText;
          element.innerHTML = element.children[0].innerHTML;
        }
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
        for (let i = element.children.length; i-- > 0; ) elementStack.push(element.children[i] as HTMLElement);
      }
    }

    // 3. Set default font style and clear font styles at elements if its same as body.
    window.document.documentElement.lang = 'en';
    window.document.head.innerHTML = `<meta charset="utf-8"><title>${window.document.title}</title>`;
    changeTagName(window.document.body, 'body', true);
    Object.assign(window.document.body.style, { fontFamily: `'Times New Roman', serif`, fontSize: '13.3333px' });
    const df = window.getComputedStyle(window.document.body);
    window.document.querySelectorAll('[style]').forEach(node => {
      if (node === window.document.body) return;

      const element = node as HTMLElement;
      const computedStyle = window.getComputedStyle(element);
      if (element.tagName === 'TD' || element.tagName === 'TABLE') {
        const width = (element as any).width && parseInt((element as any).width, 10);
        if (width && !Number.isNaN(width)) element.style.width = `${(width / 13.3333).toFixed(4)}em`;
        element.style.removeProperty('padding');
      }

      if (computedStyle.fontSize === df.fontSize) element.style.removeProperty('font-size');
      if (computedStyle.fontFamily === df.fontFamily) element.style.removeProperty('font-family');
      if (computedStyle.fontStyle === df.fontStyle) element.style.removeProperty('font-style');
      if (computedStyle.fontVariant === df.fontVariant) element.style.removeProperty('font-variant');
      if (computedStyle.fontWeight === df.fontWeight) element.style.removeProperty('font-weight');
      if (computedStyle.fontStretch === df.fontStretch) element.style.removeProperty('font-stretch');
      if (computedStyle.lineHeight === df.lineHeight) element.style.removeProperty('line-height');
      if (computedStyle.verticalAlign === df.verticalAlign) element.style.removeProperty('vertical-align');
      if (element.tagName !== 'TABLE' && element.style.borderCollapse) element.style.removeProperty('border-collapse');
      if (!element.getAttribute('style')) element.removeAttribute('style');
    });

    window.document.querySelectorAll('tr').forEach(tr => {
      if (tr.getBoundingClientRect().height <= 1) tr.remove();
    });

    window.document.querySelectorAll('table').forEach(table => {
      Object.assign(table.style, {
        borderCollapse: 'collapse',
        borderSpacing: '0',
        minWidth: `${(table.offsetWidth / 13.3333).toFixed(4)}em`,
      });
      table.removeAttribute('class');
      table.removeAttribute('border');
      table.removeAttribute('cellspacing');
      table.removeAttribute('cellpadding');
      if (parseInt(table.style.marginLeft, 10) < 0) table.style.removeProperty('margin-left');
      table.outerHTML = `<div class="table-container">${table.outerHTML}</div>`;
    });
  });
};

export default sanitizeMsWordHtml;
