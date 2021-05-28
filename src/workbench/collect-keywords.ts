import fs from 'fs-extra';
import modifyHtmls from './modifyHtmls';
import documentGroups from '../../public/document-groups.json';

const collectKeywords = async () => {
  const result = await modifyHtmls('./public/raw-html', './public/raw-html', () => {
    const [, groupName, pageName] = document.title.split(' / ');
    return [
      { label: groupName, level: 0 },
      { label: pageName, level: 1 },
      ...Array.from(document.querySelectorAll('h1,h2,h3,h4,strong,em')).flatMap(element => {
        let level;
        if (element.tagName.startsWith('H')) level = parseInt(element.tagName.substr(1), 10) + 1;
        else if (element.tagName === 'STRONG') level = 6;
        else if (element.tagName === 'EM') level = 7;
        else return [];
        return [{ label: element.textContent!.trim().replace(/:$/i, '').toLowerCase(), level }];
      }),
    ];
  });

  const anchorResult = documentGroups.flatMap(({ pages }) => {
    return pages.flatMap(page => {
      return result[`${page.basename}.html`].map(keyword => `${'  '.repeat(keyword.level)}${keyword.label}`);
    });
  });

  await fs.writeFile('./keywords.txt', anchorResult.join('\n'));
};

export default collectKeywords;
