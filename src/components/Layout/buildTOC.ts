import anchors from '../../anchors.json';

export interface StructuredTocItem {
  anchor: typeof anchors[0];
  children: StructuredTocItem[];
}

const recurseToBuildTOC = (tocItem: StructuredTocItem, current: typeof anchors[0]): StructuredTocItem[] => {
  if (tocItem.anchor.level < current.level)
    return [
      {
        anchor: tocItem.anchor,
        children: tocItem.children.length
          ? [
              ...tocItem.children.slice(0, tocItem.children.length - 1),
              ...recurseToBuildTOC(tocItem.children[tocItem.children.length - 1], current),
            ]
          : [{ anchor: current, children: [] }],
      },
    ] as StructuredTocItem[];
  return [tocItem, { anchor: current, children: [] }] as StructuredTocItem[];
};

const buildTOC = (basename: string) => {
  const filtered = anchors.filter(anchor => anchor.basename === basename);
  return filtered.reduce((toc, current) => {
    if (toc.length === 0) return [{ anchor: current, children: [] }];
    return [...toc.slice(0, toc.length - 1), ...recurseToBuildTOC(toc[toc.length - 1], current)];
  }, [] as StructuredTocItem[]);
};

export default buildTOC;
