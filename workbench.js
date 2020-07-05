function fetchDocument(url) {
  var xhr = new XMLHttpRequest();

  return new Promise((resolve, reject) => {
    xhr.open('GET', url, true);
    xhr.responseType = 'document';
    xhr.setRequestHeader('Accept', 'text/html');
    xhr.onload = () => setTimeout(() => resolve(xhr.responseXML), 0);
    xhr.onerror = () => setTimeout(() => reject(new TypeError('Network request failed')), 0);
    xhr.ontimeout = () => setTimeout(() => reject(new TypeError('Network request failed')), 0);
    xhr.onabort = () => setTimeout(() => reject(new DOMException('Aborted', 'AbortError')), 0);
    xhr.send();
  });
}

const text = (element) => element.textContent.trim().replace(/\s+/g, ' ');
window.text = text;
const normCap = (str) => str.replace(/(?<=[A-Za-z])([A-Z])/g, (a) => a.toLowerCase());
window.text = normCap;
function findMonsters(allDocuments) {
  var allMonsterDocs = allDocuments.filter((doc) => doc.title.startsWith('MONSTERS ('));
  return allMonsterDocs.flatMap((document) => {
    return Array.from(document.querySelectorAll('table')).flatMap((table) => {
      const isMonsterTable =
        Array.from(table.querySelectorAll('th'), (th) => th.textContent.trim()).indexOf('Hit Dice:') >= 0;
      if (!isMonsterTable) return [];

      var hElement = table;
      while (
        hElement &&
        (['H2', 'H3', 'H4'].indexOf(hElement.tagName) < 0 || hElement.textContent.trim().toLowerCase() === 'combat')
      )
        hElement = hElement.previousElementSibling;

      var hasEachName = !text(table.querySelectorAll('tr')[1].children[0]);

      return Array.from(table.querySelector('tr').children)
        .slice(1)
        .map((_, i) => {
          var nameElement = hasEachName ? table.querySelector('tr').children[i + 1] : hElement;
          var lookElement = hasEachName
            ? table.querySelectorAll('tr')[1].children[i + 1]
            : table.querySelector('tr').children[i + 1];
          var attributes = Array.from(table.querySelectorAll('tr')).reduce((acc, tr) => {
            if (!tr.children[0].textContent.trim()) return acc;
            return {
              ...acc,
              [text(tr.children[0]).split(/:/)[0].trim()]: text(tr.children[i + 1]),
            };
          });
          return { Name: normCap(text(nameElement)), Look: text(lookElement), ...attributes };
        });
    });
  });
}

function mapObjectArrayToArray2d(objectArray) {
  var columns = [];
  var rows = objectArray.map((monster) => {
    var row = [];
    Object.entries(monster).forEach(([key, value]) => {
      var col = columns.indexOf(key);
      if (col < 0) {
        col = columns.length;
        columns.push(key);
      }
      row[col] = value;
    });
    return row;
  });
  var table = [columns, ...rows.map((row) => Array.from(Array(columns.length), (_, i) => row[i] || ''))];
  return table;
}

function mapObjectArrayToCsv(objectArray) {
  return mapObjectArrayToArray2d(objectArray)
    .map((row) =>
      row
        .map((cell) => cell.replace(/[—–]/g, '-'))
        .map((cell) => `"\t${cell.replace(/"/g, '""')}"`)
        .join(','),
    )
    .join('\n');
}

function createTableFromArray2d(array) {
  const tableElement = document.createElement('table');
  for (let i = 0; i < array.length; i++) {
    const trElement = document.createElement('tr');
    for (let j = 0; j < array[i].length; j++) {
      const tdElement = document.createElement(i === 0 ? 'th' : 'td');
      const textContent = typeof array[i][j] !== 'object' ? array[i][j] : JSON.stringify(array[i][j]);
      const len = `${textContent}`.length;
      tdElement.textContent = textContent;
      if (len < 80) tdElement.style.whiteSpace = 'nowrap';
      trElement.appendChild(tdElement);
    }
    tableElement.appendChild(trElement);
  }
  return tableElement;
}

const hp = (a) => parseInt(a['Hit Dice'].match(/\((\d+) hp\)/)[1]);

const byHp = (a, b) => hp(a) - hp(b);

const descriptionLength = (m) =>
  Object.values(m)
    .map((m) => (typeof m === 'string' ? m.length : 0))
    .reduce((a, b) => a + b);

const byDescriptionLength = (a, b) => descriptionLength(a) - descriptionLength(b);

async function fetchDocuments() {
  const docUrls = await fetchDocument('index.html').then((document) =>
    Array.from(document.querySelectorAll('ol a'), (a) => a.href),
  );
  const allDocuments = await Promise.all(docUrls.map(fetchDocument));
  return allDocuments;
}

async function fetchMonsters() {
  const monstersJSON = window.sessionStorage.getItem('monsters');
  if (monstersJSON) return JSON.parse(monstersJSON);

  const allDocuments = await fetchDocuments();
  const monsters = findMonsters(allDocuments).sort(byDescriptionLength);
  window.sessionStorage.setItem('monsters', JSON.stringify(monsters));
  return monsters;
}

document.addEventListener('DOMContentLoaded', async () => {
  console.log('-- Workbench --');
  console.time('Workbench');
  const equipmentDoc = await fetchDocument('http://localhost:8887/docs/equipment.html');
  window.equipmentDoc = equipmentDoc;
  const result = [];
  document.getElementById('workbench').appendChild(createTableFromArray2d(mapObjectArrayToArray2d(result)));
  console.timeEnd('Workbench');
});

Object.assign({ fetchMonsters, mapObjectArrayToCsv, byHp, byDescriptionLength });
