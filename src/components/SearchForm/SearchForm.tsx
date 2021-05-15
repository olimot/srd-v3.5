/* eslint-disable jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions */
import classNames from 'classnames';
import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';
import anchors from '../../anchors.json';
import styles from './SearchForm.module.scss';

type SuggestionItem = typeof anchors[0];

const SearchForm = ({ className }: { className?: string }) => {
  const [search, setSearch] = useState({ value: '', idx: -1, suggestions: [] as SuggestionItem[] });

  const ref = useRef<HTMLFormElement | null>(null);
  useEffect(() => {
    if (ref.current && search.suggestions.length) {
      const onclick = (e: MouseEvent) => {
        if (!e.target) return;
        let parent = (e.target as Element).parentElement;
        while (parent) {
          if (parent === ref.current) return;
          parent = parent.parentElement;
        }
        setSearch({ value: '', idx: -1, suggestions: [] });
      };
      window.addEventListener('click', onclick);
      return () => window.removeEventListener('click', onclick);
    }
    return () => {};
  }, [search.suggestions.length]);

  return (
    <div className={classNames(styles.searchBox, className)}>
      <input
        type="search"
        name="search"
        autoComplete="off"
        placeholder="Search..."
        value={search.value}
        onChange={e => {
          let [suggestionOnStart, suggestionOnRest] = [[], []] as SuggestionItem[][];
          if (e.target.value && e.target.value.length > 1) {
            const searchStartRe = new RegExp(`^${e.target.value.replace(/[.*+?^${}()|[\]\\]}/g, '\\$&')}`, 'gi');
            const searchRestRe = new RegExp(e.target.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            [suggestionOnStart, suggestionOnRest] = anchors.reduce(
              ([sss, srs], item) => {
                if (searchStartRe.test(item.label)) return [[...sss, item], srs];
                if (searchRestRe.test(item.label)) return [sss, [...srs, item]];
                return [sss, srs];
              },
              [[], []] as SuggestionItem[][],
            );
            const nextSuggestions = [
              ...suggestionOnStart,
              ...suggestionOnRest.filter(
                a => !suggestionOnStart.find(b => `${a.basename}${a.hash}` === `${b.basename}${b.hash}`),
              ),
            ];
            setSearch({ value: e.target.value, idx: -1, suggestions: nextSuggestions });
          } else {
            setSearch({ value: e.target.value, idx: -1, suggestions: [] });
          }
        }}
      />
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
          <circle cx="10.5" cy="10.5" r="7.5" />
          <line x1="21" y1="21" x2="15.8" y2="15.8" />
        </g>
      </svg>
      <span className={classNames(styles.autocmplLayer, search.suggestions.length > 0 && styles.active)}>
        {search.suggestions.map((item, idx) => (
          <Link href={`/docs/${item.basename}${item.hash}`} key={`/docs/${item.basename}${item.hash}`}>
            <a
              className={classNames(styles.autocmplItem, idx === 0 && styles.active)}
              onClick={() => setSearch({ value: '', idx: -1, suggestions: [] })}
            >
              {item.label}
            </a>
          </Link>
        ))}
      </span>
    </div>
  );
};
SearchForm.defaultProps = { className: '' };
export default SearchForm;
