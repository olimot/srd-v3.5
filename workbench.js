const fetchDocument = (url) => {
  var xhr = new XMLHttpRequest();

  return new Promise((resolve, reject) => {
    xhr.open('GET', url, true);
    xhr.responseType = 'document';
    xhr.setRequestHeader('Accept', 'text/html');
    xhr.onload = () => setTimeout(() => resolve(xhr.responseXML), 0);
    xhr.onerror = (e) => setTimeout(() => reject(e), 0);
    xhr.ontimeout = (e) => setTimeout(() => reject(e), 0);
    xhr.onabort = () => setTimeout(() => reject(new DOMException('Aborted', 'AbortError')), 0);
    xhr.send();
  });
};

const getHeadingText = (e) =>
  e.textContent
    .toLowerCase()
    .trim()
    .replace(/\s+/, ' ')
    .replace(/(^\w{1})|(\s{1}\w{1})/g, (match) => match.toUpperCase());

async function main() {
  const docAnchors = await fetchDocument('index.html').then((document) =>
    Array.from(document.querySelectorAll('ol a')),
  );

  const allAnchors = (
    await Promise.all(
      docAnchors.map(async (docAnchor, docPriority) => {
        const document = await fetchDocument(docAnchor.href);
        const headings = document.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]');
        return [
          { url: docAnchor.getAttribute('href'), textContent: getHeadingText(docAnchor), priority: 1, docPriority },
          ...Array.from(headings, (heading) => {
            Array.from(heading.querySelectorAll('small'), (small) => {
              small.remove();
            });
            return {
              href: `${docAnchor.getAttribute('href')}#${heading.id}`,
              textContent: getHeadingText(heading),
              priority: parseInt(heading.tagName.substr(1), 10),
              docPriority,
            };
          }),
        ];
      }),
    )
  ).flat();

  allAnchors.sort((a, b) => {
    if (/^armor$/i.test(a.textContent) && /^armor$/i.test(b.textContent))
      console.log(
        a,
        b,
        b.textContent.length - a.textContent.length,
        a.docPriority - b.docPriority,
        a.priority - b.priority,
      );
    return -a.textContent.localeCompare(b.textContent) || b.docPriority - a.docPriority || b.priority - a.priority;
  });

  const isInAnchor = (rng) => {
    let e = rng.startContainer.nodeType === 1 ? rng.startContainer : rng.startContainer.parentElement;
    while (e && e !== rng.endContainer && e.tagName !== 'A') e = e.nextSibling;
    if (e && e.tagName === 'A') return true;
    e = rng.startContainer.nodeType === 1 ? rng.startContainer : rng.startContainer.parentElement;
    while (e && e !== rng.endContainer && e.tagName !== 'A') e = e.parentElement;
    return !!e && e.tagName === 'A';
  };

  allAnchors.forEach(({ href, textContent }) => {
    while (window.find(textContent)) {
      const rng = window.getSelection().getRangeAt(0);
      const originalTextContent = rng.cloneContents().textContent;

      const wordRegex = new RegExp(`(\\W|^)${textContent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|\\W)`, 'i');
      if (!wordRegex.test(rng.startContainer.textContent)) continue;

      const isInA = isInAnchor(rng);

      if (isInA) {
        console.log(rng.startContainer);
        continue;
      }

      rng.deleteContents();
      const a = document.createElement('a');
      a.href = href;
      a.textContent = originalTextContent;
      rng.insertNode(a);
    }
    window.getSelection().removeAllRanges();
  });
  

  Object.assign(window, { allAnchors });
}

document.addEventListener('DOMContentLoaded', async () => {
  console.log('-- Workbench --');
  console.time('Workbench');
  await main();
  console.timeEnd('Workbench');
});
