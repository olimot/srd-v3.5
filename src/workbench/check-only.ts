import modifyHtmls from './modifyHtmls';

// fs.ensureDirSync('./.cache');
const checkOnly = async () => {
  await modifyHtmls('./data/original-html', './.cache', () => {
    const stack: Node[] = [window.document.body];
    while (stack.length) {
      const node = stack.pop() as Node;

      // eslint-disable-next-line no-plusplus
      if (node.childNodes) for (let i = node.childNodes.length; i-- > 0; ) stack.push(node.childNodes[i]);
    }
  });
};

export default checkOnly;
