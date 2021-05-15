import classNames from 'classnames';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import anchors from '../../anchors.json';
import SearchForm from '../SearchForm';
import buildTOC from './buildTOC';
import styles from './Layout.module.scss';
import TocItem from './TocItem';

const documentGroups = anchors
  .filter(a => a.level === 1)
  .reduce((prev, current) => {
    const groupIndex = prev.findIndex(group => group.groupName === current.groupName);
    if (groupIndex === -1) return [...prev, { groupName: current.groupName, pages: [current] }];
    return [
      ...prev.slice(0, groupIndex),
      { ...prev[groupIndex], pages: [...prev[groupIndex].pages, current] },
      ...prev.slice(groupIndex + 1),
    ];
  }, [] as { groupName: string; pages: typeof anchors }[]);

const Layout = ({ children }: { children?: any }) => {
  const router = useRouter();
  const basename = decodeURIComponent(
    router.asPath
      .split('#')[0]
      .split('/')
      .pop() || '',
  );
  const toc = buildTOC(basename);
  const [isSidebarVisible, setSidebarVisible] = useState<boolean | null>(null);
  const [isTOCVisible, setTOCVisible] = useState<boolean | null>(null);
  const { pageName, groupName: pageGroupName } =
    anchors.find(anchor => anchor.level === 1 && anchor.basename === basename) || {};

  useEffect(() => {
    setSidebarVisible(window.innerWidth >= 1024);
  }, []);

  useEffect(() => {
    if (!isTOCVisible && !isSidebarVisible) return () => {};
    const dissmissTOC = (e: MouseEvent) => {
      let cursor: HTMLElement | null = e.target as HTMLElement;
      if (isSidebarVisible && window.innerWidth < 1024) {
        while (cursor && !cursor.classList.contains(styles.sidebar)) cursor = cursor.parentElement;
        if (!cursor?.classList.contains(styles.sidebar)) setSidebarVisible(false);
      } else if (isTOCVisible) {
        while (cursor && !cursor.classList.contains(styles.toc)) cursor = cursor.parentElement;
        if (!cursor?.classList.contains(styles.toc)) setTOCVisible(false);
      }
    };
    window.addEventListener('click', dissmissTOC);
    return () => window.removeEventListener('click', dissmissTOC);
  }, [isTOCVisible, isSidebarVisible]);
  return (
    <div
      className={classNames(
        styles.block,
        isSidebarVisible === null && styles.blockInit,
        isSidebarVisible && styles.blockWithSidebar,
        toc.length === 0 && styles.blockWithoutTOC,
      )}
    >
      <Head>
        <title>v3.5 SRD{pageName && ` - ${pageName}`}</title>
      </Head>
      <div className={styles.pageControls}>
        <button type="button" onClick={() => setSidebarVisible(!isSidebarVisible)}>
          <svg
            preserveAspectRatio="xMidYMid meet"
            height="1em"
            width="1em"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            stroke="currentColor"
          >
            <g>
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </g>
          </svg>
        </button>
        <h2>
          {pageGroupName && (
            <>
              <span className={styles.currentGroupName}>{pageGroupName}</span> /{' '}
            </>
          )}
          {pageName}
        </h2>
        {toc.length > 0 && (
          <button type="button" className={styles.toggleTOC} onClick={() => setTOCVisible(!isTOCVisible)}>
            <svg
              preserveAspectRatio="xMidYMid meet"
              height="1em"
              width="1em"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              stroke="currentColor"
            >
              <g>
                <line x1="21" y1="10" x2="7" y2="10" />
                <line x1="21" y1="6" x2="3" y2="6" />
                <line x1="21" y1="14" x2="3" y2="14" />
                <line x1="21" y1="18" x2="7" y2="18" />
              </g>
            </svg>
          </button>
        )}
      </div>
      <div className={styles.mainWrap}>
        {toc.length > 0 && (
          <aside
            className={classNames(
              styles.toc,
              isTOCVisible === true && styles.tocVisible,
              isTOCVisible === false && styles.tocHidden,
            )}
          >
            <h2>In This Article</h2>
            <ul>
              {toc.map(item => (
                <TocItem key={item.anchor.basename} item={item} />
              ))}
            </ul>
          </aside>
        )}
        <main className={classNames(styles.main)}>{children}</main>
      </div>
      <nav className={styles.sidebar}>
        <div>
          <SearchForm className={styles.searchForm} />
          <h2>
            <Link href="/">Revised (v.3.5) System Reference Document</Link>
          </h2>
        </div>
        <ul className={styles.groupList}>
          {documentGroups.map(group => (
            <li key={group.groupName}>
              <details open={!!group.pages.find(page => page.basename === basename)}>
                <summary>{group.groupName}</summary>
                <ul className={styles.inGroupList}>
                  {group.pages.map(page => (
                    <li key={page.basename}>
                      <Link href={`/docs/${page.basename.split('.')[0]}`} prefetch={false}>
                        <a className={classNames(basename === page.basename && 'active')}>{page.pageName}</a>
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

Layout.defaultProps = { children: undefined };

export default Layout;
