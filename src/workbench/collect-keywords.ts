const collectAnchors = async () => {
  // const result = await modifyHtmls('./public/raw-html', './public/raw-html', () => {
  //   const [, groupName, pageName] = document.title.split(' / ');
  //   return Array.from(document.querySelectorAll('h1, h2, h3, h4, h5'), element => {
  //   });
  // });
  // const anchorResult = documentGroups.flatMap(({ pages }) => {
  //   return pages.flatMap(page => {
  //     return result[`${page.basename}.html`].map(v => ({
  //       ...v,
  //       filename: `${page.basename}.html`,
  //       basename: page.basename,
  //       hash: `#${v.id}`,
  //     }));
  //   });
  // });
  // fs.writeJSONSync('./src/anchors.json', anchorResult);
};

export default collectAnchors;
