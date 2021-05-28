import modifyHtmls from './modifyHtmls';
import documentGroups from '../../public/document-groups.json';

const addSemantics = async () => {
  await modifyHtmls(
    './.cache/sanitized-html',
    './public/raw-html',
    groups => {
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

      document.head.childNodes.forEach(n => n.nodeType === 3 && n.remove());
      document.documentElement.childNodes.forEach(n => n.nodeType === 3 && n.remove());

      // Remove irregular whitespaces, multiple whitespaces and newlines to single whitespace
      (() => {
        const nodes = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
        for (let node = nodes.nextNode(); node; node = nodes.nextNode()) {
          node.nodeValue = (node.nodeValue || '').replace(/[\s\u00a0]+/gi, ' ');
        }
      })();

      const removeUselessSpan = () => {
        let cursor = document.querySelector<HTMLElement>('span:not([style])');
        while (cursor) {
          cursor.outerHTML = cursor.innerHTML;
          cursor = document.querySelector<HTMLElement>('span:not([style])');
        }
      };
      removeUselessSpan();

      const flatSpan = () => {
        let $0 = document.querySelector<HTMLElement>('span span');
        while ($0) {
          const parentElement = $0.parentElement!;
          const childNodes = Array.from(parentElement.childNodes);
          const index = childNodes.indexOf($0);
          if (childNodes.length === 1) parentElement.outerHTML = parentElement.innerHTML;
          else if (index === 0) parentElement.insertAdjacentElement('beforebegin', $0);
          else if (index === childNodes.length - 1) parentElement.insertAdjacentElement('afterend', $0);
          else {
            const afterTarget = parentElement.cloneNode(false) as HTMLElement;
            while ($0.nextSibling) afterTarget.appendChild($0.nextSibling);
            parentElement.insertAdjacentElement('afterend', afterTarget);
            parentElement.insertAdjacentElement('afterend', $0);
          }
          $0 = document.querySelector<HTMLElement>('span span');
        }
      };
      flatSpan();

      document.querySelectorAll('span[style*="vertical-align: super"]').forEach(span => {
        const sup = changeTagName(span, 'sup') as HTMLElement;
        sup.style.removeProperty('vertical-align');
        sup.style.removeProperty('font-size');
        if (!sup.style.length) sup.removeAttribute('style');
      });

      // merge bold text
      const mergeBoldText = () => {
        let $0 = document.querySelector<HTMLElement>('span[style*="font-weight"]');
        while ($0) {
          let $1 = $0.nextSibling;
          while (
            $1 &&
            (($1.nodeType === 3 && !$1.nodeValue!.trim()) ||
              ($1.nodeType === 1 && ($1 as HTMLElement).style.fontWeight))
          ) {
            if ($1.nodeType === 1) {
              ($1 as HTMLElement).style.removeProperty('font-weight');
              if (!($1 as HTMLElement).style.length) ($1 as HTMLElement).removeAttribute('style');
            }
            $0.appendChild($1);
            $1 = $0.nextSibling;
          }
          changeTagName($0, 'strong', true);
          $0 = document.querySelector<HTMLElement>('span[style*="font-weight"]');
        }
      };
      mergeBoldText();

      document.body
        .querySelectorAll<HTMLSpanElement>('span[style="font-style: italic;"]')
        .forEach(e => changeTagName(e, 'i', true));

      document.querySelectorAll<HTMLElement>('strong + strong, i + i, sup + sup').forEach(e => {
        while (
          (e.previousSibling?.nodeType === 3 && !e.previousSibling?.nodeValue?.trim()) ||
          (e.previousSibling?.nodeType === 1 && (e.previousSibling as HTMLElement)?.tagName === e.tagName)
        ) {
          const target = e.previousSibling;
          e.prepend(target);
          if (target.nodeType === 1) {
            const targetElement = target as HTMLElement;
            targetElement.outerHTML = targetElement.innerHTML;
          }
        }
      });

      // sanitize whitespaces for inline element
      document.body.querySelectorAll<HTMLSpanElement>('strong, i').forEach(element => {
        const firstChildNode = element.childNodes[0];
        if (!firstChildNode) return;

        if (firstChildNode.nodeType === 3 && firstChildNode.nodeValue && /^\s/.test(firstChildNode.nodeValue)) {
          firstChildNode.nodeValue = firstChildNode.nodeValue.trimLeft();
          element.insertAdjacentText('beforebegin', ' ');
          let cursor = element.parentElement;
          while (cursor?.childNodes[0] === element && cursor?.tagName === 'SPAN') {
            cursor.insertAdjacentText('beforebegin', ' ');
            cursor = cursor.parentElement;
          }
        }
        const lastChildNode = element.childNodes[element.childNodes.length - 1];
        if (lastChildNode.nodeType === 3 && lastChildNode.nodeValue && /\s$/.test(lastChildNode.nodeValue)) {
          lastChildNode.nodeValue = lastChildNode.nodeValue.trimRight();
          element.insertAdjacentText('afterend', ' ');
          let cursor = element.parentElement;
          while (cursor && cursor.childNodes[cursor.childNodes.length - 1] === element && cursor.tagName === 'SPAN') {
            cursor.insertAdjacentText('afterend', ' ');
            cursor = cursor.parentElement;
          }
        }
      });

      // Fix error in strongs and change non important strongs to b tags.
      document.querySelectorAll<HTMLElement>('strong').forEach(e => {
        if (e.textContent === 'Harm:' && e.previousSibling?.nodeValue === ' ') {
          while (e.previousSibling?.nodeValue) e.prepend(e.previousSibling);
        } else if (!e.textContent?.trim().endsWith(':')) {
          if (e.textContent === 'Effect') {
            e.textContent = 'Effect:';
          } else if (e.textContent === '5 Psionic RevivifyAX') {
            e.appendChild(document.createTextNode(':'));
            e.nextSibling!.nodeValue = e.nextSibling!.nodeValue!.substr(1);
          } else if (e.textContent === 'Etherealness,') {
            e.appendChild(document.createTextNode(' Psionic:'));
            e.nextSibling!.nodeValue = e.nextSibling!.nodeValue!.substr(' Psionic:'.length);
          } else if (e.nextSibling?.nodeType === 3 && e.nextSibling?.nodeValue?.startsWith(':')) {
            e.nextSibling.nodeValue = e.nextSibling.nodeValue.substr(1);
            e.insertAdjacentText('beforeend', ':');
          } else if (e.nextSibling?.nodeType === 1 && (e.nextSibling as HTMLElement).textContent?.startsWith(':')) {
            const firstTextNode = document.createTreeWalker(e.nextSibling, NodeFilter.SHOW_TEXT, null).nextNode()!;
            firstTextNode.nodeValue = firstTextNode.nodeValue!.substr(1);
            e.insertAdjacentText('beforeend', ':');
          } else if (e.parentElement?.tagName === 'TD' && e.parentElement.children.length === 1) {
            e.parentElement.style.fontWeight = '700';
            e.outerHTML = e.innerHTML;
          } else if (e.parentElement?.style.fontWeight) {
            e.outerHTML = e.innerHTML;
          } else {
            changeTagName(e, 'b', true);
          }
        }
      });

      // Fix error in i tags
      document.querySelectorAll<HTMLElement>('i').forEach($0 => {
        if ($0.textContent?.length === 1 || $0.textContent === 'e.') $0.outerHTML = $0.innerHTML;
        else {
          if (
            $0.previousSibling?.nodeType === 3 &&
            $0.previousSibling?.nodeValue &&
            /[a-z]$/i.test($0.previousSibling.nodeValue)
          ) {
            if (/\b[a-z]$/i.test($0.previousSibling.nodeValue)) {
              const splits = $0.previousSibling.nodeValue.split(/\s+/);
              const textToInsert = splits.pop() as string;
              $0.insertAdjacentText('afterbegin', textToInsert);
              $0.previousSibling.nodeValue = splits.join(' ');
            } else if (/\b[0-9]\/da$/i.test($0.previousSibling.nodeValue)) {
              const [textToInsert] = $0.previousSibling.nodeValue.match(/([0-9]\/da)$/i) || [];
              $0.insertAdjacentText('afterbegin', textToInsert);
              $0.previousSibling.nodeValue = $0.previousSibling.nodeValue.substr(
                0,
                $0.previousSibling.nodeValue.length - textToInsert.length,
              );
            } else if (/^[^a-z]/i.test($0.textContent!)) {
              const [textToInsert] = $0.textContent!.match(/^([^a-z]+)/i) || [];
              if (textToInsert) {
                $0.previousSibling.nodeValue += textToInsert;
                $0.textContent = $0.textContent!.substr(textToInsert.length);
              }
            }
          }
          if ($0.nextSibling?.nodeType === 3 && $0.nextSibling?.nodeValue && /^[a-z]/i.test($0.nextSibling.nodeValue)) {
            if (/^[a-z]\b/i.test($0.nextSibling.nodeValue)) {
              const splits = $0.nextSibling.nodeValue.split(/\s+/);
              const textToInsert = splits.shift() as string;
              $0.insertAdjacentText('beforeend', textToInsert);
              $0.nextSibling.nodeValue = splits.join(' ');
            } else if (/[^a-z]$/i.test($0.textContent!)) {
              const [textToInsert] = $0.textContent!.match(/([^a-z]+)$/i) || [];
              if (textToInsert) {
                $0.nextSibling.nodeValue = textToInsert + $0.nextSibling.nodeValue;
                $0.textContent = $0.textContent!.substr(0, $0.textContent!.length - textToInsert.length);
              }
            }
          }
        }
      });

      // e.toggleAttribute('data-x');
      // 쩜으로 시작하는 거하고, 숫자로 시작하는 거 어떻게 할지...!

      // make div 1.to be unordered list item or 2.to have blockwise bigger font
      document.body.querySelectorAll('div').forEach($0 => {
        if (
          !$0.parentElement ||
          $0.className === 'table-container' ||
          (() => {
            let $1: HTMLElement | null = $0.parentElement;
            while ($1 && $1.tagName !== 'TABLE' && $1.tagName !== 'LI') $1 = $1.parentElement;
            return $1;
          })()
        )
          return;

        if ($0.textContent!.trim()[0] === '†') {
          $0.style.removeProperty('font-weight');
        }

        const firstTextNode = (() => {
          const walker = document.createTreeWalker($0, NodeFilter.SHOW_TEXT, null);
          let node = walker.nextNode();
          while (node && !node.nodeValue?.trim()) node = walker.nextNode();
          return node;
        })();
        const firstStyle = firstTextNode && window.getComputedStyle(firstTextNode.parentElement!);
        const firstFontSize = (firstStyle && parseInt(firstStyle.fontSize || '13.3333', 10)) || 13.3333;

        // Making unordered list
        if ($0.textContent && /^[0-9]\s/.test($0.textContent.trim()) && firstStyle?.fontWeight === '700') {
          const liElement = document.createElement('li');
          $0.parentElement.insertBefore(liElement, $0);
          const [, label] = $0.textContent.match(/^[0-9]\s+([^:]+)(:|$)/i) || [];
          if (label) $0.setAttribute('aria-label', label);
          liElement.appendChild($0);

          // Only for PowerList.html
          $0.style.removeProperty('margin-left');
          let node = liElement.nextSibling;
          while (
            node &&
            ((node.nodeType === 3 && !node.nodeValue?.trim()) ||
              (node.nodeType === 1 &&
                node.textContent &&
                !/^[0-9]\s/.test(node.textContent.trim() || '') &&
                (node as HTMLElement).tagName === 'DIV' &&
                (node as HTMLElement).style.marginLeft &&
                !(node as HTMLElement).style.fontSize))
          ) {
            const next = node.nextSibling;
            if (node.nodeType === 1) {
              const [, label2] = (node as HTMLElement).textContent!.trim().match(/^([^:]+)(:|$)/i) || [];
              const newElement = changeTagName(node as Element, 'div', true);
              if (label2) newElement.setAttribute('aria-label', label2);
              liElement.appendChild(newElement);
            } else {
              liElement.appendChild(node);
            }
            node = next;
          }
        } else if (firstFontSize > 13.3333 && !firstTextNode?.nodeValue?.startsWith('•')) {
          const isBlockwiseFontSize = parseInt($0.style.fontSize, 10) === firstFontSize;
          const newDivElement = document.createElement('div');
          newDivElement.style.fontSize = `${firstFontSize}px`;
          $0.insertAdjacentElement('beforebegin', newDivElement);
          Array.from($0.childNodes).forEach($1 => {
            if ($1.nodeType === 1) {
              const childElement = $1 as HTMLElement;
              const childStyle = window.getComputedStyle(childElement);
              const childFontSize = parseFloat(childStyle.fontSize) || 13.3333;
              if (childFontSize !== firstFontSize) {
                newDivElement.appendChild(changeTagName(childElement, 'small'));
              } else {
                childElement.style.removeProperty('font-size');
                if (!childElement.style.length) newDivElement.insertAdjacentHTML('beforeend', childElement.innerHTML);
                else newDivElement.insertAdjacentElement('beforeend', childElement);
              }
            } else if (!isBlockwiseFontSize) {
              const smallElement = document.createElement('small');
              smallElement.textContent = $1.nodeValue;
              newDivElement.appendChild(smallElement);
            } else {
              newDivElement.appendChild($1);
            }
          });
          $0.remove();
        }
      });

      // create list element
      (() => {
        let $0 = document.querySelector('body > li');
        while ($0) {
          const isOrdered = /^[0-9]\s/.test($0.textContent?.trim() || '');
          const listElement = document.createElement(isOrdered ? 'ol' : 'ul');
          $0.parentElement!.insertBefore(listElement, $0);
          listElement.appendChild($0);

          let cursor = listElement.nextSibling;
          while (
            cursor &&
            ((cursor.nodeType === 3 && !cursor.nodeValue?.trim()) ||
              (cursor.nodeType === 1 && (cursor as HTMLElement).tagName === 'LI'))
          ) {
            const next = cursor.nextSibling;
            listElement.appendChild(cursor);
            cursor = next;
          }
          $0 = document.querySelector('body > li');
        }
      })();

      // create headings and paragraphs
      let title = '';
      document.body.querySelectorAll('div').forEach($0 => {
        const element = $0 as HTMLElement;
        if (!element) return;
        const fontSizeValue = element.style.fontSize;
        const fontSize = fontSizeValue ? parseInt(fontSizeValue, 10) : 13.3333;
        const wrongParent = (() => {
          let $1: HTMLElement | null = $0.parentElement;
          while ($1 && $1.tagName !== 'TABLE' && $1.tagName !== 'LI') $1 = $1.parentElement;
          return $1;
        })();
        if (wrongParent) return;

        if (fontSize >= 24 && !title) {
          changeTagName($0, 'h1', true);
          title = $0.textContent || '';
        } else if (fontSize >= 24) changeTagName($0, 'h2', true);
        else if (fontSize >= 16 && fontSize < 24) changeTagName($0, 'h3', true);
        else if (
          (fontSize > 13.3333 && fontSize < 15) ||
          (element.textContent && !/[a-z]/.test(element.textContent) && !/Legal.html$/i.test(document.location.href))
        )
          changeTagName($0, 'h4', true);
        else if ($0.querySelectorAll('div,p,table').length === 0) {
          const prevBr =
            $0.previousElementSibling?.tagName === 'BR' &&
            $0.previousElementSibling.previousElementSibling?.className !== 'table-container' &&
            $0.previousElementSibling.previousElementSibling?.textContent?.trim() !== 'PSIONIC FEATS'
              ? $0.previousElementSibling
              : null;
          if (prevBr) prevBr.remove();
          const text = $0.textContent?.trim() || '';
          if (
            (($0.style.length === 1 && $0.style.fontWeight === '700') || (prevBr && $0.children.length === 0)) &&
            !/^[0-9]\s/.test(text) &&
            !/[.:]$/.test(text) &&
            !/Legal.html$/i.test(document.location.href)
          ) {
            changeTagName($0, 'h5', true);
          } else {
            const onlyForTracking = $0.cloneNode(true) as HTMLElement;
            onlyForTracking.querySelectorAll('sup, small').forEach($1 => $1.remove());
            const [, label2] = onlyForTracking.textContent!.trim().match(/^(?:• )?([^:]+):/i) || [];
            const newElement = changeTagName($0, 'p');
            if (label2) newElement.setAttribute('aria-label', label2);
          }
        }
      });

      document.querySelectorAll('br').forEach(q => q.remove());

      // sanitize page title
      (() => {
        const basename = window.location.href
          .split('/')
          .pop()
          ?.split('.')[0];
        const thePage = groups?.flatMap(a => {
          const c = a.pages.find(p => p.basename.toLowerCase() === basename?.toLowerCase());
          if (c) return [{ ...c, groupName: a.groupName }];
          return [];
        })[0];
        if (!thePage) document.title = `TITLE NOT FOUND(${basename})`;
        else document.title = `v3.5 SRD / ${thePage.groupName} / ${thePage.label || title}`;
      })();

      // sanitize table attributes, add captions in tables
      document.body.querySelectorAll('table').forEach($0 => {
        $0.removeAttribute('width');
        $0.removeAttribute('valign');
        $0.style.removeProperty('margin-left');
        const prevElement = $0.parentElement!.previousElementSibling;
        const prevHeadingText = prevElement && prevElement.tagName.startsWith('H') && prevElement.textContent?.trim();
        if (prevElement && prevHeadingText && /^Table: /i.test(prevHeadingText)) {
          // Fix error in EpicPrestigeClasses.html
          const caption = document.createElement('caption');
          caption.textContent = prevHeadingText;
          $0.insertAdjacentElement('afterbegin', caption);
          prevElement.remove();
        } else if (prevElement && prevHeadingText && /^Using Spot to Read Lips$/i.test(prevHeadingText)) {
          // Fix error in EpicPrestigeClasses.html
          const p = document.createElement('p');
          const strong = document.createElement('strong');
          strong.textContent = `Using Spot to Read Lips:`;
          p.appendChild(strong);
          prevElement.insertAdjacentElement('beforebegin', p);
          prevElement.remove();
          $0.dataset.noCaption = '1';
        } else {
          const numColumn = Math.max(...Array.from($0.querySelectorAll('tr'), tr => tr.children.length));
          const firstCell = $0.querySelector('td') as HTMLTableCellElement;
          const textContent = firstCell.textContent?.trim() || '';
          if (firstCell.colSpan === numColumn && /^Table: /i.test(textContent)) {
            const caption = document.createElement('caption');
            caption.textContent = textContent;
            $0.insertAdjacentElement('afterbegin', caption);
            firstCell.parentElement?.remove();
          } else {
            $0.dataset.noCaption = '1';
          }
        }
      });

      document.body.querySelectorAll('td').forEach(q => {
        q.removeAttribute('width');
        q.removeAttribute('valign');
        const { width, fontWeight, fontStyle, verticalAlign, paddingLeft } = q.style;
        q.removeAttribute('style');
        if (width) q.style.width = width;
        if (fontWeight) q.style.fontWeight = fontWeight;
        if (verticalAlign) q.style.fontWeight = fontWeight;
        if (fontStyle) q.style.fontStyle = fontStyle;
        if (paddingLeft) q.style.paddingLeft = paddingLeft;
      });

      document.body.querySelectorAll('tr,tbody').forEach(q => q.removeAttribute('style'));

      // create slug and id
      document.querySelectorAll('h1,h2,h3,h4,h5').forEach((headline, key) => {
        const slug = headline
          .textContent!.trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/-+$|^-+/g, '');

        headline.id = `${headline.tagName.toLowerCase()}-${key}-${slug}`;
      });

      // create sections
      document.querySelectorAll<HTMLHeadingElement>('h1,h2,h3,h4,h5').forEach(headline => {
        const level = parseInt(headline.tagName.substr(1), 10);
        const stopperSelector = Array.from(Array(level), (_, n) => `H${n + 1}`);
        const section = document.createElement('section');
        while (headline.nextElementSibling && stopperSelector.indexOf(headline.nextElementSibling.tagName) === -1)
          section.appendChild(headline.nextElementSibling);
        const { id } = headline;
        headline.removeAttribute('id');
        section.id = id;
        headline.insertAdjacentElement('beforebegin', section);
        section.insertAdjacentElement('afterbegin', headline);
      });

      document.body.removeAttribute('style');
    },
    documentGroups,
  );
};

export default addSemantics;
