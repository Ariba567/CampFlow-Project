import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Scrolls the window to the top whenever the route pathname changes.
 *
 * Mount this once inside the Router (e.g. right after <BrowserRouter>) so the
 * reset applies globally to every route change. It keys on `location.pathname`
 * only — not on `location.hash` or `location.key` — so hash-only changes
 * (same-page anchor links, e.g. FAQ jump-to sections) do not trigger a reset.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
