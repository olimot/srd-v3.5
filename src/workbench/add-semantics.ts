import fs from 'fs-extra';
import modifyHtmls from './modifyHtmls';

const addSemantics = async () => {
  const result = await modifyHtmls('./.cache/sanitized-html', './data/html', () => {
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

    document.body.querySelectorAll('span').forEach(q => {
      if (
        parseInt(window.getComputedStyle(q).fontSize, 10) > 13.3333 &&
        q.textContent !== '• ' &&
        q.nextElementSibling &&
        !(q.nextElementSibling as HTMLElement).style.fontSize &&
        q.parentElement?.children[0] === q
      ) {
        q.removeAttribute('style');
        const { textContent } = q;
        changeTagName(q.nextElementSibling, 'small');
        const element = changeTagName(q.parentElement, 'h3', true);
        element.id = textContent!
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/-+$|^-+/g, '');
      }
    });

    document.body.querySelectorAll('div').forEach(q => {
      const fontSize = parseInt(window.getComputedStyle(q).fontSize, 10);
      let element: Element | null = null;
      if (fontSize > 13.3333 && fontSize < 15) {
        element = changeTagName(q, 'h4', true);
      } else if (fontSize >= 16 && fontSize < 24) {
        element = changeTagName(q, 'h3', true);
      } else if (fontSize >= 24) {
        element = changeTagName(q, 'h2', true);
      }

      if (element) {
        const candidateId = element
          .textContent!.trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/-+$|^-+/g, '');
        if (candidateId === 'combat') return;
        const prevDesignated = document.getElementById(candidateId);
        if (!prevDesignated || parseInt(prevDesignated.tagName.substr(1), 10) > parseInt(element.tagName.substr(1), 10))
          element.id = candidateId;
      }
    });

    return Array.from(document.querySelectorAll('[id]'), element => ({
      id: element.id,
      textContent:
        element.textContent
          ?.trim()
          .toLowerCase()
          .replace(/\s+/, ' ')
          .replace(/(^\w{1})|([^a-zA-Z]\w{1})/g, match => match.toUpperCase())
          .replace(/\b(i{1,3}|iv|vi{0,3})\b/gi, match => match.toUpperCase()) || '',
      hnum: parseInt(element.tagName.substr(1), 10),
    }));
  });

  const anchorResult = Object.entries(result).flatMap(([k, vs]) => {
    return vs.map(v => ({ ...v, filename: k, href: `${k}#${v.id}` }));
  });
  fs.writeJSONSync('./data/anchors.json', anchorResult);
};

export default addSemantics;
