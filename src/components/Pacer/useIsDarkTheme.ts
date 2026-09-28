import { useEffect, useState } from 'react';

/**
 * Tracks the `dark` class that `useApplyTheme` writes on `<html>`.
 *
 * The pacer needs the resolved theme, not the preference: `theme: 'system'`
 * can flip underneath it. Observing the class means there is one source of
 * truth and no second copy of the media-query logic.
 */
export function useIsDarkTheme(): boolean {
  const [isDark, setIsDark] = useState(() =>
    typeof document === 'undefined' ? true : document.documentElement.classList.contains('dark'),
  );

  useEffect(() => {
    const root = document.documentElement;
    const read = () => setIsDark(root.classList.contains('dark'));
    read();
    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}
