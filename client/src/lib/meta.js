import { useEffect } from 'react';

/** SEO-titlar/metabeskrivningar enligt spec §10.1, samt noindex för admin/portal. */
export function usePageMeta({ title, description, noindex = false }) {
  useEffect(() => {
    if (title) document.title = title;
    setMeta('description', description);
    setMeta('robots', noindex ? 'noindex, nofollow' : null);
    setOg('og:title', title);
    setOg('og:description', description);
  }, [title, description, noindex]);
}

function setMeta(name, content) {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!content) { if (name === 'robots' && el) el.remove(); return; }
  if (!el) { el = document.createElement('meta'); el.setAttribute('name', name); document.head.appendChild(el); }
  el.setAttribute('content', content);
}
function setOg(prop, content) {
  if (!content) return;
  let el = document.querySelector(`meta[property="${prop}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute('property', prop); document.head.appendChild(el); }
  el.setAttribute('content', content);
}
