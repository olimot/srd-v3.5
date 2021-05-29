import modifyHtmls from './modifyHtmls';
import documentGroups from '../../public/document-groups.json';

const addSemantics = async () => {
  await modifyHtmls(
    './.cache/sanitized-html',
    './public/raw-html',
    groups => {
      const changeTagName = (element: HTMLElement, tagName: string) => {
        const newElement = document.createElement(tagName);
        newElement.innerHTML = element.innerHTML;
        for (let i = 0; i < element.attributes.length; i += 1)
          newElement.setAttribute(element.attributes[i].name, element.attributes[i].value);
        element.insertAdjacentElement('beforebegin', newElement);
        element.remove();
        return newElement as HTMLElement;
      };

      const getFirstNonEmptyChild = (node: Node) => {
        let firstNonEmpty = node.firstChild;
        while (firstNonEmpty && firstNonEmpty.nodeType === 3 && !firstNonEmpty.nodeValue?.trim())
          firstNonEmpty = firstNonEmpty.nextSibling;
        return firstNonEmpty;
      };

      const wrapElement = <T extends HTMLElement>(element: HTMLElement, tagName: string): T => {
        const wrapperElement = document.createElement(tagName);
        element.insertAdjacentElement('beforebegin', wrapperElement);
        wrapperElement.appendChild(element);
        return wrapperElement as T;
      };

      const debug = (element: HTMLElement, message: string) => {
        let m = message.toLowerCase();
        if (/[,\s]/i.test(m)) m = `\`${message}\``;
        if (!element.dataset.debug) {
          element.dataset.debug = `${m}`;
          return;
        }
        const flags = element.dataset.debug.split(/,\s+/);
        if (flags.indexOf(m) !== -1) return;
        element.dataset.debug = [...element.dataset.debug.split(/,\s+/), m].join(', ');
      };

      // Remove irregular, multiple, or meaningless whitespaces and change newlines to single whitespace
      document.head.childNodes.forEach(n => n.nodeType === 3 && n.remove());
      document.documentElement.childNodes.forEach(n => n.nodeType === 3 && n.remove());
      (() => {
        const nodes = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
        for (let node = nodes.nextNode(); node; node = nodes.nextNode()) {
          node.nodeValue = (node.nodeValue || '').replace(/[\s\u00a0]+/gi, ' ');
        }
      })();

      // Remove spans not styled
      (() => {
        let cursor = document.querySelector<HTMLElement>('span:not([style])');
        while (cursor) {
          cursor.outerHTML = cursor.innerHTML;
          cursor = document.querySelector<HTMLElement>('span:not([style])');
        }
      })();

      // Flatten divs
      (() => {
        let $0 = document.querySelector<HTMLElement>('div > div');
        while ($0) {
          const parentElement = $0.parentElement!;
          parentElement.outerHTML = parentElement.innerHTML;
          $0 = document.querySelector<HTMLElement>('div > div');
        }
      })();

      // Flatten spans
      (() => {
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
      })();

      // make sup tags
      document.querySelectorAll<HTMLElement>('span[style*="vertical-align: super"]').forEach(span => {
        const sup = changeTagName(span, 'sup') as HTMLElement;
        sup.style.removeProperty('vertical-align');
        sup.style.removeProperty('font-size');
        if (!sup.style.length) sup.removeAttribute('style');
      });

      // make b tags
      (() => {
        let $0 = document.querySelector<HTMLElement>('span[style*="font-weight"]');
        while ($0) {
          const bElement = wrapElement($0, 'b');
          $0.style.removeProperty('font-weight');
          if (!$0.style.length && $0.tagName === 'SPAN') $0.outerHTML = $0.innerHTML;

          let $1 = bElement.nextSibling;
          while (
            $1 &&
            (($1.nodeType === 3 && !$1.nodeValue!.trim()) ||
              ($1.nodeType === 1 && ($1 as HTMLElement).style.fontWeight))
          ) {
            bElement.appendChild($1);
            if ($1.nodeType === 1) {
              const $2 = $1 as HTMLElement;
              $2.style.removeProperty('font-weight');
              if (!$2.style.length && $2.tagName === 'SPAN') $2.outerHTML = $2.innerHTML;
            }
            $1 = bElement.nextSibling;
          }
          $0 = document.querySelector<HTMLElement>('span[style*="font-weight"]');
        }
      })();

      // create i tags
      document.body.querySelectorAll<HTMLSpanElement>('span[style="font-style: italic;"]').forEach(e => {
        e.outerHTML = `<i>${e.innerHTML}</i>`;
      });

      // merge adjacent elements which have same tags
      document.querySelectorAll<HTMLElement>('b + b, i + i, sup + sup').forEach(e => {
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
      document.body.querySelectorAll<HTMLSpanElement>('b, i').forEach(element => {
        const firstChildNode = element.childNodes[0];
        if (!firstChildNode) return;

        if (firstChildNode.nodeType === 3 && firstChildNode.nodeValue && /^\s/.test(firstChildNode.nodeValue)) {
          firstChildNode.nodeValue = firstChildNode.nodeValue.trimLeft();
          element.insertAdjacentText('beforebegin', ' ');
        }
        const lastChildNode = element.childNodes[element.childNodes.length - 1];
        if (lastChildNode.nodeType === 3 && lastChildNode.nodeValue && /\s$/.test(lastChildNode.nodeValue)) {
          lastChildNode.nodeValue = lastChildNode.nodeValue.trimRight();
          element.insertAdjacentText('afterend', ' ');
        }
      });

      // Fix error in b tags
      document.querySelectorAll<HTMLElement>('b').forEach(e => {
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
          const liElement = wrapElement($0, 'li');
          const firstB = liElement.querySelector('b');
          if (firstB) firstB.outerHTML = `<strong>${firstB.innerHTML}</strong>`;
          // Below are only for PowerList.html
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
              const b = (node as HTMLElement).querySelector('b');
              if (b) b.outerHTML = `<strong>${b.innerHTML}</strong>`;
              liElement.insertAdjacentHTML('beforeend', `<div>${(node as HTMLElement).innerHTML}</div>`);
              node.remove();
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
              if (smallElement.previousSibling?.nodeValue?.endsWith('[')) {
                const p = smallElement.previousSibling!;
                p.nodeValue = p.nodeValue!.substr(0, p.nodeValue!.length - 1);
                smallElement.insertAdjacentText('afterbegin', '[');
              }
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
      document.body.querySelectorAll<HTMLElement>('div').forEach($0 => {
        const fontSizeValue = $0.style.fontSize;
        const fontSize = fontSizeValue ? parseInt(fontSizeValue, 10) : 13.3333;
        const { textContent } = $0;
        if (
          !textContent ||
          (() => {
            let $1: HTMLElement | null = $0.parentElement;
            while ($1 && $1.tagName !== 'TABLE' && $1.tagName !== 'LI') $1 = $1.parentElement;
            return $1;
          })()
        )
          return;

        if (fontSize >= 24) {
          $0.outerHTML = `<h1>${$0.innerHTML}</h1>`;
          if (!title) title = textContent;
        } else if (fontSize >= 16 && fontSize < 24) {
          $0.outerHTML = `<h2>${$0.innerHTML}</h2>`;
        } else if (
          (fontSize > 13.3333 && fontSize < 15) ||
          (!/[a-z]/.test(textContent) && !/Legal.html$/i.test(document.location.href))
        ) {
          $0.outerHTML = `<h3>${$0.innerHTML}</h3>`;
        } else if ($0.querySelectorAll('div,p,table').length === 0) {
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
            $0.outerHTML = `<h4>${$0.innerHTML}</h4>`;
          } else {
            const firstNonEmpty = getFirstNonEmptyChild($0);
            const $1 = firstNonEmpty?.nodeType === 1 ? (firstNonEmpty as HTMLElement) : null;
            if ($1 && ($1.tagName === 'B' || ($1.tagName === 'I' && $1.textContent?.trim().endsWith(':'))))
              changeTagName($1, $1.tagName === 'B' ? 'strong' : 'em');
            changeTagName($0, 'p');
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

      // Fix table errors in EpicMagicItems1.html
      if (/EpicMagicItems2.html$/i.test(document.location.href)) {
        const h4s = Array.from(document.querySelectorAll('h4'));
        const actualSpellLevel = h4s.find($0 => $0.textContent?.trim() === 'Table: Actual Spell Level');
        const metamagicLevel = h4s.find($0 => $0.textContent?.trim() === 'Table: Metamagic Level Adjustment to Spells');
        const staffs = Array.from(document.querySelectorAll('h1')).find($0 => $0.textContent?.trim() === 'STAFFS');
        if (actualSpellLevel && metamagicLevel && staffs) {
          const mergeTablesBetween = (start: Element, end: Element) => {
            const tableContainer = document.createElement('div');
            const table = document.createElement('table');
            const tbody = document.createElement('tbody');
            table.appendChild(tbody);
            tableContainer.appendChild(table);
            tableContainer.className = 'table-container';
            start.insertAdjacentElement('afterend', tableContainer);

            let $0 = tableContainer.nextElementSibling;
            while ($0 && $0 !== end) {
              if ($0.className === 'table-container') {
                tbody.insertAdjacentHTML('beforeend', $0.querySelector('tbody')!.innerHTML);
              } else {
                tbody.insertAdjacentHTML(
                  'beforeend',
                  `<tr><td colspan="2" style="font-weight: 700;">${$0.textContent?.trim() || ''}</td></tr>`,
                );
              }
              $0.remove();
              $0 = tableContainer.nextElementSibling;
            }
          };
          mergeTablesBetween(actualSpellLevel, metamagicLevel);
          mergeTablesBetween(metamagicLevel, staffs);
        }
      }

      // sanitize table attributes, add captions in tables
      document.body.querySelectorAll('table').forEach($0 => {
        $0.removeAttribute('width');
        $0.removeAttribute('valign');
        $0.removeAttribute('style');
        const numColumn = Math.max(...Array.from($0.querySelectorAll('tr'), tr => tr.children.length));
        const firstFullColumnTr = Array.from($0.querySelectorAll('tr')).find(tr => {
          const tds = tr.querySelectorAll('td');
          if (tds.length !== numColumn) return false;
          if (tr.querySelector('td[colspan]')) {
            return false;
          }
          return true;
        });

        if (!firstFullColumnTr) debug($0, 'no-full-column');

        if (firstFullColumnTr) {
          const widths = Array.from(firstFullColumnTr.querySelectorAll('td'), td =>
            td.style.width ? parseFloat(td.style.width) || 0 : 0,
          );
          const tableWidth = widths.reduce((a, b) => a + b + 0.5 /* padding */);
          const hasNarrowTable = tableWidth <= 51.9;
          if (!hasNarrowTable) $0.style.minWidth = `${tableWidth}em`;
          $0.querySelectorAll('td').forEach(td => {
            if (td.parentElement !== firstFullColumnTr) td.style.removeProperty('width');
          });
        }

        // Add/Replace captions
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
          debug($0, 'no-caption');
        } else {
          const firstCell = $0.querySelector('td') as HTMLTableCellElement;
          const textContent = firstCell.textContent?.trim() || '';
          if (firstCell.colSpan === numColumn && /^Table: /i.test(textContent)) {
            const caption = document.createElement('caption');
            caption.textContent = textContent;
            $0.insertAdjacentElement('afterbegin', caption);
            firstCell.parentElement?.remove();
          } else {
            debug($0, 'no-caption');
          }
        }
      });

      document.body.querySelectorAll('td').forEach(q => {
        q.removeAttribute('width');
        q.removeAttribute('valign');
        const { width, fontWeight, fontStyle, verticalAlign, paddingLeft } = q.style;
        q.removeAttribute('style');
        if (width) q.style.minWidth = width;
        if (fontWeight) q.style.fontWeight = fontWeight;
        if (verticalAlign) q.style.fontWeight = fontWeight;
        if (fontStyle) q.style.fontStyle = fontStyle;
        if (paddingLeft) q.style.paddingLeft = paddingLeft;
      });

      document.body.querySelectorAll('tr,tbody').forEach(q => q.removeAttribute('style'));

      // 1.create slug and id, 2.make spell/power list as ul
      document.querySelectorAll<HTMLHeadingElement>('h1,h2,h3,h4').forEach((headline, key) => {
        const textContent = headline.textContent?.trim();
        if (!textContent) return;

        let slug = textContent.toLowerCase();
        const from = 'ãàáäâẽèéëêìíïîõòóöôùúüûñç·/_,:;';
        const to = 'aaaaaeeeeeiiiiooooouuuunc------';
        for (let i = 0, l = from.length; i < l; i += 1) {
          slug = slug.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
        }
        slug = slug
          .replace(/[^a-z0-9 -]/g, '') // remove invalid chars
          .replace(/\s+/g, '-') // collapse whitespace and replace by -
          .replace(/-+/g, '-'); // collapse dashes;
        headline.id = `${headline.tagName.toLowerCase()}-${key}-${slug}`;

        // Make spell or power list to ul
        const testee = (textContent.match(/^[^(]+/i) || [])[0]?.trim();
        if (!testee || !/^(0|[1-9](st|nd|rd|th))-level\s.*\s(spell|power)s?$/i.test(testee)) return;
        const ulElement = document.createElement('ul');
        let $1 = headline.nextElementSibling;
        while ($1 && $1.tagName === 'P' && $1.children[0] && $1.children[0].tagName === 'STRONG') {
          ulElement.appendChild(changeTagName($1 as HTMLElement, 'li'));
          $1 = headline.nextElementSibling;
        }
        headline.insertAdjacentElement('afterend', ulElement);
      });

      // Split Blockwise bold texts in list items to div and strong
      document.querySelectorAll<HTMLDivElement>('li > div[style="font-weight: 700;"]').forEach($0 => {
        $0.removeAttribute('style');
        $0.innerHTML = `<strong>${$0.innerHTML}</strong>`;
      });

      // Remove empty style attribute
      document.querySelectorAll<HTMLElement>('[style]').forEach($0 => {
        if (!$0.style.length) $0.removeAttribute('style');
      });

      // Create sections
      document.querySelectorAll<HTMLHeadingElement>('h1,h2,h3,h4').forEach(headline => {
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
