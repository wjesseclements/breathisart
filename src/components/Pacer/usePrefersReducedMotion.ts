import { useEffect, useState } from 'react';
import { useSettings } from '../../store/useSettings';

const QUERY = '(prefers-reduced-motion: reduce)';

/**
 * True when motion should be reduced: either the OS asks for it, or the
 * user forced it via the in-app override (PRD §5 visual options).
 */
export function usePrefersReducedMotion(): boolean {
  const preference = useSettings((s) => s.motionPreference);
  const [systemReduced, setSystemReduced] = useState(() => window.matchMedia(QUERY).matches);

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const onChange = () => setSystemReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return preference === 'reduced' || systemReduced;
}
