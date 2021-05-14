import React, { useEffect } from 'react';

const DocumentView = ({ html }: { html: string }) => {
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const id = entry.target.getAttribute('id');
        const tocItem = document.querySelector(`aside a[data-toc-id="${id}"]`);
        if (!tocItem) return;
        if (entry.intersectionRatio > 0) tocItem.classList.add('active');
        else tocItem.classList.remove('active');
      });

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
    });

    // Track all sections that have an `id` applied
    document.querySelectorAll('section[id]').forEach(section => {
      observer.observe(section);
    });
    return () => observer.disconnect();
  }, [html]);

  // eslint-disable-next-line react/no-danger
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

export default DocumentView;
