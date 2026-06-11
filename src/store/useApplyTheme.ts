import { useEffect } from 'react';
import { useSettings } from './useSettings';

const QUERY = '(prefers-color-scheme: dark)';

/** Applies the theme preference as a `dark` class on <html>. */
export function useApplyTheme(): void {
  const theme = useSettings((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia(QUERY);
    const apply = () => {
      root.classList.toggle('dark', theme === 'dark' || (theme === 'system' && mq.matches));
    };
    apply();
    if (theme !== 'system') return;
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);
}
