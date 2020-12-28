/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/no-danger */
import classNames from 'classnames';
import Head from 'next/head';
import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';
import anchors from '../../../data/anchors.json';
import SearchForm from '../SearchForm';
import styles from './DocumentView.module.scss';

const DocumentView = ({ filename, html }: { filename: string; html: string }) => {
  const [menuActive, setMenuActive] = useState(false);
  const [, docHTML] = html.split(/<body[^<>]*>|<\/body>/gi);
  const urlRe = new RegExp(`^${filename.replace(/[.*+?^${}()|[\]\\]}/g, '\\$&')}\\.html`);
  const headings = anchors.filter(i => urlRe.test(i.filename));

  const headerref = useRef<HTMLElement | null>(null);
  const navref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const showDrawerCn = `layout--fixed-drawer`;
    const layout = document.querySelector('.layout');
    const drawer = document.querySelector('.layout>nav') as HTMLElement;
    if (!drawer || !layout) return () => {};
    setTimeout(() => layout.classList.add('layout--ready'), 16);
    if (window.innerWidth < 660) {
      if (layout.classList.contains(showDrawerCn)) {
        layout.classList.remove('layout--ready');
        setMenuActive(false);
        layout.classList.remove(showDrawerCn);
      }
      const onclick = (e: MouseEvent) => {
        if (!e.target || !navref.current || !headerref.current) return;
        let parent = (e.target as Element).parentElement;
        while (parent) {
          if (parent === navref.current || parent === headerref.current) return;
          parent = parent.parentElement;
        }
        setMenuActive(false);
      };
      window.addEventListener('click', onclick);
      return () => window.removeEventListener('click', onclick);
    }

    if (window.innerWidth >= 660 && !layout.classList.contains(showDrawerCn)) {
      layout.classList.remove('layout--ready');
      setMenuActive(true);
    }
    return () => {};
  }, []);

  return (
    <div className={classNames('layout layout--site-header layout--ready', menuActive && 'layout--fixed-drawer')}>
      <Head>
        <title>{filename} - SRD3.5</title>
      </Head>
      <header ref={headerref}>
        <button type="button" className="icon icon--menu" onClick={() => setMenuActive(!menuActive)}>
          Navigate this page
        </button>
        <div>
          <Link href="/">
            <a className="link">SRD 3.5</a>
          </Link>
          <SearchForm />
        </div>
        <nav ref={navref}>
          <a href="https://github.com/olimot/srd-v3.5">GitHub</a>{' '}
        </nav>
      </header>
      <nav className={styles.toc}>
        {headings.map(heading => (
          <a
            href={`#${heading.href.split('#').pop()}`}
            key={heading.href}
            className={styles[`anchor-${heading.hnum}`]}
            onClick={() => {
              if (window.innerWidth < 660) setMenuActive(false);
            }}
          >
            {heading.textContent}
          </a>
        ))}
      </nav>
      <div className={classNames(styles.documentView, 'layout__wrap')} dangerouslySetInnerHTML={{ __html: docHTML }} />
    </div>
  );
};

export default DocumentView;
