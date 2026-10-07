import { useEffect } from 'react';

/**
 * The one address search engines and link previews should credit.
 *
 * The same app answers at www.lamptide.com, lamptide.app, lampti.de and the
 * original breathisart.vercel.app. Without a canonical link a search engine
 * sees four copies of every page and picks one itself. Vercel made `www` the
 * primary when the domain was added, so that is the one named here — change it
 * in this one place if the primary ever moves.
 */
export const SITE_ORIGIN = 'https://www.lamptide.com';

/** Sets the tab title and points the canonical link at this page's real address. */
export function usePageTitle(title: string, path: string): void {
  useEffect(() => {
    document.title = title;
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonical) canonical.href = `${SITE_ORIGIN}${path}`;
  }, [title, path]);
}
