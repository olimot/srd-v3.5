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
  const [layoutReady, setLayoutReady] = useState<boolean>(false);
  const [menuActive, setMenuActive] = useState<boolean>(false);
  const [, docHTML] = html.split(/<body[^<>]*>|<\/body>/gi);
  const htmlFilename = `${filename}.html`;

  const headerref = useRef<HTMLElement | null>(null);
  const navref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const mobileWidth = 1126;
    if (window.innerWidth >= mobileWidth) setMenuActive(true);
    setTimeout(() => setLayoutReady(true), 16);

    const onclick = (e: MouseEvent) => {
      if (window.innerWidth < mobileWidth) {
        if (!e.target || !navref.current || !headerref.current) return;
        let parent = (e.target as Element).parentElement;
        while (parent) {
          if (parent === navref.current || parent === headerref.current) return;
          parent = parent.parentElement;
        }
        setMenuActive(false);
      }
    };
    window.addEventListener('click', onclick);
    return () => window.removeEventListener('click', onclick);
  }, []);

  return (
    <div className={classNames('layout', layoutReady && 'layout--ready', menuActive && 'layout--fixed-drawer')}>
      <Head>
        <title>{filename} - SRD3.5</title>
      </Head>
      <header ref={headerref}>
        <button type="button" className="icon icon--menu" onClick={() => setMenuActive(!menuActive)}>
          Navigate this page
        </button>
        <nav ref={navref}>
          <SearchForm />
          <Link href="/">
            <a className="link">Home</a>
          </Link>
          <a href="https://github.com/olimot/srd-v3.5">GitHub</a>
        </nav>
      </header>
      <nav className={styles.toc}>
        {anchors
          .filter(a => a.filename === htmlFilename)
          .map(heading => (
            <a
              href={heading.href.replace(/\.html/, '')}
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
