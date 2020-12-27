/* eslint-disable react/no-danger */
import classNames from 'classnames';
import Link from 'next/link';
import React, { useState } from 'react';
import anchors from '../../../data/anchors.json';
import SearchForm from '../SearchForm';
import styles from './DocumentView.module.scss';

const DocumentView = ({ filename, html }: { filename: string; html: string }) => {
  const [menuActive, setMenuActive] = useState(true);
  const [, docHTML] = html.split(/<body[^<>]*>|<\/body>/gi);
  const urlRe = new RegExp(`^${filename.replace(/[.*+?^${}()|[\]\\]}/g, '\\$&')}\\.html`);
  const headings = anchors.filter(i => urlRe.test(i.filename));

  return (
    <div className={classNames('layout layout-ready layout--site-header', menuActive && 'layout--fixed-drawer')}>
      <header>
        <button type="button" className="icon icon--menu" onClick={() => setMenuActive(!menuActive)}>
          Navigate this page
        </button>
        <div>
          <Link href="/">
            <a className="link">SRD 3.5</a>
          </Link>
          <SearchForm />
        </div>
        <nav>
          <a href="#">GitHub</a>{' '}
        </nav>
      </header>
      <nav className={styles.toc}>
        {headings.map(heading => (
          <a href={`#${heading.href.split('#').pop()}`} key={heading.href} className={styles[`anchor-${heading.hnum}`]}>
            {heading.textContent}
          </a>
        ))}
      </nav>
      <div className={classNames(styles.documentView, 'layout__wrap')} dangerouslySetInnerHTML={{ __html: docHTML }} />
    </div>
  );
};

export default DocumentView;
