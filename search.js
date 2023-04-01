const innerTextifier = Object.assign(document.createElement('div'), { style: 'width: 0; height:0; overflow:hidden;' });
document.addEventListener('DOMContentLoaded', () => document.body.appendChild(innerTextifier));
function innerTextify(innerHTML) {
  innerTextifier.innerHTML = innerHTML;
  innerTextifier.querySelectorAll('sub,sup,small').forEach((e) => {
    e.insertBefore(window.document.createTextNode(' '), e.firstChild);
    e.appendChild(window.document.createTextNode(' '));
  });
  return innerTextifier.innerText.trim();
}

function createStructuredDocument(document) {
  const normWs = (text) => text.replace(/[\r\n\t ]+/gi, ' ').trim();
  return [...document.querySelectorAll('h1,h2[id],h3[id],h4[id]')]
    .map((e) => {
      const level = ['', 'H1', 'H2', 'H3', 'H4'].indexOf(e.tagName);
      const title = level === 1 ? document.title.split(' / ').pop() : normWs(e.textContent).trim();
      const url = `${document.location.href}${e.id ? `#${e.id}` : ''}`;
      let innerHTML = '';
      for (let o = e.nextSibling; o && (o.nodeType !== 1 || !o.tagName.startsWith('H')); o = o.nextSibling) {
        if (o.nodeType === 3) innerHTML += o.nodeValue;
        else if (o.nodeType === 1) innerHTML += o.outerHTML;
      }
      return { url, title, innerHTML, level };
    })
    .map((e, i, a) => {
      const reverseToTop = a.slice(0, i).reverse();
      const [, path] = reverseToTop.reduce(
        (prev, item, index) => {
          const [prevLevel, prevPath] = prev;
          if (item.level >= prevLevel) return prev;
          return [item.level, [-1 - index, ...prevPath]];
        },
        [e.level, []],
      );
      return { path, ...e };
    });
}

function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function getPageDocument(location) {
  if (!(location instanceof URL)) location = new URL(location, window.location);
  const pageDocument = new DOMParser().parseFromString(await (await fetch(location.href)).text(), 'text/html');
  const handler = {
    get(target, prop) {
      if (prop === 'location') return location;
      if (typeof target[prop] === 'function') return target[prop].bind(target);
      return target[prop];
    },
  };
  return new Proxy(pageDocument, handler);
}

async function getAllPageUrls() {
  const indexPageDocument = await getPageDocument('./index.html');
  return [...indexPageDocument.querySelectorAll('p+ul a')].map((a) => new URL(a.href));
}

async function createStructuredDocuments() {
  const pages = await Promise.all((await getAllPageUrls()).map(getPageDocument));
  return pages
    .flatMap(createStructuredDocument)
    .map(({ path, ...item }, index) => ({ id: index, path: path.map((p) => index + p), ...item }));
}

async function downloadJSON(data, filename) {
  const anchorElement = document.createElement('a');
  anchorElement.href = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data))}`;
  anchorElement.download = filename;
  anchorElement.innerText = `Download ${filename}`;
  window.document.body.appendChild(anchorElement);
  anchorElement.click();
}

async function buildLunrIndex(documents) {
  return lunr(function () {
    this.ref('id');
    this.field('title');
    this.field('innerText');
    this.field('path');
    documents.forEach((doc) => {
      const path = doc.path.map((p) => documents[p].title).join(' › ');
      this.add({ ...doc, path });
    });
  });
}

const mapResponseToJSON = (res) => (res.status < 200 || res.status >= 300 ? null : res.json());

function initSearch(documents, index) {
  const queryString = new URLSearchParams(location.search).get('q');
  document.getElementById('input').value = queryString || '';

  document.getElementById('search-results').append(
    ...index
      .search(queryString)
      .slice(0, 100)
      .map((searchResult) => {
        const doc = documents[searchResult.ref];

        const element = document.createElement('div');
        element.className = 'search-result-item';

        const pathElement = document.createElement('div');
        pathElement.className = 'path-text';
        pathElement.append(
          ...doc.path.flatMap((p, i) => {
            const pathLink = document.createElement('a');
            pathLink.innerText = documents[p].title;
            pathLink.href = documents[p].url;
            if (i === 0) return [pathLink];
            return [document.createTextNode(' › '), pathLink];
          }),
        );
        element.appendChild(pathElement);

        const titleElement = document.createElement('h3');
        const titleLinkElement = document.createElement('a');
        titleLinkElement.href = doc.url;
        titleLinkElement.innerText = doc.title;
        titleElement.appendChild(titleLinkElement);
        element.appendChild(titleElement);

        const contentElement = document.createElement('div');
        contentElement.innerHTML = doc.innerHTML;
        element.appendChild(contentElement);

        return element;
      }),
  );
}

function getDuplicatesIndices(array) {
  const set = new Set();
  const result = new Set();
  for (let i = 0; i < array.length; i++) {
    if (set.has(array[i])) result.add(i);
    else set.add(array[i]);
  }
  return [...result].sort((a, b) => a - b);
}

async function main() {
  // const documents = await fetch('./documents.json').then(mapResponseToJSON);
  // const index = lunr.Index.load(await fetch('./index.json').then(mapResponseToJSON));
  // initSearch(documents, index);

  const pageDocuments = await Promise.all((await getAllPageUrls()).map(getPageDocument));
  Object.assign(window, { pageDocuments });
  const hashes = window.pageDocuments.flatMap((d) =>
    Array.from(d.querySelectorAll('[id]'), (e) => `${d.location.pathname}#${e.id}`),
  );
  // const index = buildLunrIndex(doucments);
  // Object.assign(window, { documents, index });
  // console.log('Initialized...!');
}

document.addEventListener('DOMContentLoaded', main);
