import Link from 'next/link';
import React from 'react';
import { StructuredTocItem } from './buildTOC';

const TocLink = ({ item }: { item: StructuredTocItem }) => (
  <Link href={`/docs/${item.anchor.href.replace(/\.html/, '')}`}>
    <a data-toc-id={item.anchor.href.split('#').pop()}>{item.anchor.textContent}</a>
  </Link>
);

const TocList = ({ item }: { item: StructuredTocItem }) => (
  <ul>
    {item.children.map(child => (
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      <TocItem key={child.anchor.href} item={child} />
    ))}
  </ul>
);

const TocItem = ({ item }: { item: StructuredTocItem }) => {
  return (
    <li>
      {item.children.length > 0 && item.anchor.hnum !== 1 ? (
        <details>
          <summary>
            <TocLink item={item} />
          </summary>
          <TocList item={item} />
        </details>
      ) : (
        <>
          <TocLink item={item} />
          <TocList item={item} />
        </>
      )}
    </li>
  );
};

export default TocItem;
