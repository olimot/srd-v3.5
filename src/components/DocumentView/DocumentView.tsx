import React, { useEffect } from 'react';
import styles from './DocumentView.module.scss';

const DocumentView = ({ html }: { html: string }) => {
  useEffect(() => {
    const onScroll = () => {
      const tocLinks = Array.from(document.querySelectorAll<HTMLElement>('aside a[data-toc-id]'), element => {
        const section = document.getElementById(element.dataset.tocId!) as HTMLElement;
        const distanceToTop = window.scrollY - section.offsetTop + 16;
        return { element, distanceToTop };
      });
      tocLinks.sort((a, b) => Math.abs(a.distanceToTop) - Math.abs(b.distanceToTop));
      const theActive = tocLinks.find(({ distanceToTop }) => distanceToTop > 0) || tocLinks[0];
      document
        .querySelectorAll(`aside a.active[data-toc-id]`)
        .forEach(e => e !== theActive.element && e.classList.remove('active'));
      theActive.element.classList.add('active');

      document.querySelectorAll(`aside details`).forEach(element => {
        const details = element as HTMLDetailsElement;
        const hasActive = !!details.querySelector('a.active');
        if (!hasActive && details.open && details.dataset.openedByObserver) {
          details.open = false;
          delete details.dataset.openedByObserver;
        }
        if (hasActive && !details.open) {
          details.open = true;
          details.dataset.openedByObserver = 'true';
        }
      });
    };
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [html]);

  // eslint-disable-next-line react/no-danger
  return <div className={styles.document} dangerouslySetInnerHTML={{ __html: html }} />;
};

export default DocumentView;
