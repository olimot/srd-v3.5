import React from 'react';
import { StructuredTocItem } from './buildTOC';

const TocLink = ({ item }: { item: StructuredTocItem }) => (
  <a href={item.anchor.hash} data-toc-id={item.anchor.id}>
    {item.anchor.label}
  </a>
);

const TocList = ({ item }: { item: StructuredTocItem }) => (
  <ul>
    {item.children.map(child => (
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      <TocItem key={`${child.anchor.filename}${child.anchor.id}`} item={child} />
    ))}
  </ul>
);

const TocItem = ({ item }: { item: StructuredTocItem }) => {
  return (
    <li>
      {item.children.length > 0 ? (
        <details>
          <summary>
            <TocLink item={item} />
          </summary>
          <TocList item={item} />
        </details>
      ) : (
        <TocLink item={item} />
      )}
    </li>
  );
};

export default TocItem;
