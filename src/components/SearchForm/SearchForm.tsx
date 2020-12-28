/* eslint-disable jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions */
import classNames from 'classnames';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
import anchors from '../../../data/anchors.json';
import styles from './SearchForm.module.scss';

type SuggestionItem = { id: string; hnum: number; href: string; textContent: string };

const suggestionPool: SuggestionItem[] = anchors.map(item => ({
  ...item,
  href: `/docs/${item.href.replace(/\.html/g, '')}`,
}));

const SearchForm = () => {
  const [search, setSearch] = useState({ value: '', idx: -1 });
  const router = useRouter();

  let [suggestionOnStart, suggestionOnRest] = [[], []] as SuggestionItem[][];
  if (search.value) {
    const searchStartRe = new RegExp(`^${search.value.replace(/[.*+?^${}()|[\]\\]}/g, '\\$&')}`, 'gi');
    const searchRestRe = new RegExp(search.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    [suggestionOnStart, suggestionOnRest] = suggestionPool.reduce(
      ([sss, srs], item) => {
        if (searchStartRe.test(item.textContent)) return [[...sss, item], srs];
        if (searchRestRe.test(item.textContent)) return [sss, [...srs, item]];
        return [sss, srs];
      },
      [[], []] as SuggestionItem[][],
    );
  }
  const suggestion = [...suggestionOnStart, ...suggestionOnRest];

  const ref = useRef<HTMLFormElement | null>(null);
  useEffect(() => {
    if (ref.current && suggestion.length) {
      const onclick = (e: MouseEvent) => {
        if (!e.target) return;
        let parent = (e.target as Element).parentElement;
        while (parent) {
          if (parent === ref.current) return;
          parent = parent.parentElement;
        }
        setSearch({ value: '', idx: -1 });
      };
      window.addEventListener('click', onclick);
      return () => window.removeEventListener('click', onclick);
    }
    return () => {};
  }, [suggestion.length]);
  return (
    <form
      method="GET"
      action=""
      onSubmit={e => {
        e.preventDefault();
        if (suggestion.length) router.push(suggestion[0].href);
        setSearch({ value: '', idx: -1 });
      }}
      ref={ref}
    >
      <p className={styles.searchForm}>
        <span className={styles.searchBox}>
          <input
            type="search"
            name="search"
            placeholder="Go to page..."
            value={search.value}
            onChange={e => setSearch({ value: e.target.value, idx: -1 })}
          />
          <span className={classNames(styles.autocmplLayer, suggestion.length > 0 && styles.active)}>
            {suggestion.map((item, idx) => (
              <Link href={item.href} key={item.href}>
                <a
                  className={classNames(styles.autocmplItem, idx === 0 && styles.active)}
                  onClick={() => setSearch({ value: '', idx: -1 })}
                >
                  {item.textContent}
                </a>
              </Link>
            ))}
          </span>
        </span>
        <button type="submit">Go</button>
      </p>
    </form>
  );
};

export default SearchForm;
