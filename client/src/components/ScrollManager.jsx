import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Scrollar till toppen vid sidbyte, till ankare vid hash (blueprint §4.4). */
export function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, hash]);
  return null;
}
