import classNames from 'classnames';
import Link from 'next/link';
import React from 'react';
import documentGroups from '../../../data/document-groups.json';
import styles from './App.module.scss';

const App = () => {
  return (
    <div className={classNames(styles.app, 'layout')}>
      <div className={classNames(styles.appwrap, 'layout__wrap')}>
        <p className={styles.externalLinks}>
          <a href="https://github.com/olimot/srd-v3.5">Github</a>
        </p>
        <h1 className={styles.center}>Revised (v.3.5) System Reference Document</h1>
        <p>
          The System Reference Document is a comprehensive toolbox consisting of rules, races, classes, feats, skills,
          various systems, spells, magic items, and monsters compatible with the d20 System version of Dungeons &
          Dragons and various other roleplaying games from Wizards of the Coast. You may consider this material Open
          Game Content under the Open Game License, and may use, modify, and distribute it.
        </p>
        <p>
          Source:{' '}
          <a href="http://www.wizards.com/default.asp?x=d20/article/srd35">
            http://www.wizards.com/default.asp?x=d20/article/srd35
          </a>
          <br /> (archive: <a href="https://archive.org/details/dnd35srd">https://archive.org/details/dnd35srd</a>)
        </p>
        <div className={styles.tableOfContents}>
          {documentGroups.map(group => {
            return (
              <div key={group.groupName}>
                <h3>{group.groupName}</h3>
                <ul>
                  {group.pages.map(page => (
                    <li key={page.href}>
                      <Link href={`/docs/${page.href.split('.')[0]}`} prefetch={false}>
                        {page.textContent}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default App;
