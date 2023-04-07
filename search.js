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

function collectHashtags(document = window.document) {
  const rootInfo = { href: document.location.pathname, title: document.title.split(' - ')[0] ?? document.title };
  const hashtags = [{ ...rootInfo, path: [rootInfo] }];
  for (const element of document.querySelectorAll('[id]')) {
    const title = element.textContent
      .replace(/[\r\n\t ]+/gi, ' ')
      .replace(/[\r\n\t ]*:[\r\n\t ]*$/g, '')
      .trim();
    const href = `${document.location.pathname}${element.id ? `#${element.id}` : ''}`;

    const hashtag = { href, title, path: [{ href, title }] };
    hashtags.push(hashtag);

    let parent = null;
    for (let i = hashtags.length - 2; i >= 0 && !parent; i--) {
      if (href.startsWith(hashtags[i].href)) parent = hashtags[i];
    }
    if (parent) hashtag.path.unshift(...parent.path);
  }
  return hashtags;
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
  return [...indexPageDocument.querySelectorAll('ul.index a')].map((a) => new URL(a.href));
}

async function downloadJSON(data, filename) {
  const anchorElement = document.createElement('a');
  anchorElement.href = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data))}`;
  anchorElement.download = filename;
  anchorElement.innerText = `Download ${filename}`;
  window.document.body.appendChild(anchorElement);
  anchorElement.click();
}

const mapResponseToJSON = (res) => (res.status < 200 || res.status >= 300 ? null : res.json());

async function main() {
  // const documents = await fetch('./documents.json').then(mapResponseToJSON);
  // const index = lunr.Index.load(await fetch('./index.json').then(mapResponseToJSON));
  // initSearch(documents, index);

  const pageDocuments = await Promise.all((await getAllPageUrls()).map(getPageDocument));

  const hashtags = pageDocuments.flatMap(collectHashtags).map((hashtag) => {
    const element = document.createElement('p');
    element.append(
      ...hashtag.path.flatMap((pathItem, index) => {
        const linkElement = document.createElement('a');
        linkElement.href = pathItem.href;
        linkElement.textContent = pathItem.title;
        return index ? [document.createTextNode(' › '), linkElement] : [linkElement];
      }),
    );
    const lowerCasePathText = hashtag.path
      .map((p) => p.title)
      .join(' › ')
      .toLowerCase();
    return { ...hashtag, pathElement: element, lowerCasePathText };
  });

  Object.assign(window, { pageDocuments, hashtags });

  const searchResult = document.getElementById('search-result');

  const index = lunr(function () {
    this.ref('ref');
    this.field('textContent');
    hashtags.forEach((hashtag, ref) => {
      this.add({ ref, textContent: hashtag.lowerCasePathText });
    });
  });

  document.getElementById('search-form').addEventListener('input', (e) => {
    e.preventDefault();
    searchResult.innerHTML = '';
    let queryString = document.getElementById('input').value;
    if (!queryString) return;

    const exactMathces = hashtags.filter((h) => h.lowerCasePathText.includes(queryString));
    const lunrMatches = index
      .search(queryString)
      .map((r) => hashtags[r.ref])
      .filter((h) => !exactMathces.includes(h));

    const limit = 20;
    const halfLimit = ~~(limit / 2);
    let exactMatchLimit = halfLimit;
    let lunrMatchLimit = halfLimit;
    if (lunrMatches.length < halfLimit) exactMatchLimit = limit - lunrMatches.length;
    else if (exactMathces.length < halfLimit) lunrMatchLimit = limit - exactMathces.length;
    exactMathces.slice(0, exactMatchLimit).forEach((hashtag) => searchResult.append(hashtag.pathElement));
    lunrMatches.slice(0, lunrMatchLimit).forEach((hashtag, i) => {
      if (!i) searchResult.append(Object.assign(document.createElement('h3'), { textContent: 'See also...' }));
      searchResult.append(hashtag.pathElement);
    });
  });
}

document.addEventListener('DOMContentLoaded', main);
