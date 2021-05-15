import classNames from 'classnames';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import documentGroups from '../../../data/document-groups.json';
import SearchForm from '../SearchForm';
import buildTOC from './buildTOC';
import styles from './Layout.module.scss';
import TocItem from './TocItem';

const Layout = ({ children }: { children?: any }) => {
  const router = useRouter();
  const lastPath = decodeURIComponent(
    router.asPath
      .split('#')[0]
      .split('/')
      .pop() || '',
  );
  const filename = `${lastPath}.html`;
  const toc = buildTOC(filename);
  const [isSidebarVisible, setSidebarVisible] = useState<boolean | null>(null);
  const [isTOCVisible, setTOCVisible] = useState<boolean | null>(null);
  const { textContent: currentMenuName, groupName: currentGroupName } =
    documentGroups.flatMap(a => a.pages.map(b => ({ ...b, groupName: a.groupName }))).find(a => a.href === filename) ||
    {};

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
        <title>v3.5 SRD{currentMenuName && ` - ${currentMenuName}`}</title>
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
          {currentGroupName && (
            <>
              <span className={styles.currentGroupName}>{currentGroupName}</span> /{' '}
            </>
          )}
          {currentMenuName}
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
                <TocItem key={item.anchor.href} item={item} />
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
              <details open={!!group.pages.find(page => page.href === filename)}>
                <summary>{group.groupName}</summary>
                <ul className={styles.inGroupList}>
                  {group.pages.map(page => (
                    <li key={page.href}>
                      <Link href={`/docs/${page.href.split('.')[0]}`} prefetch={false}>
                        <a className={classNames(filename === page.href && 'active')}>{page.textContent}</a>
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
