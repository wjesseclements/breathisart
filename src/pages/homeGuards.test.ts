import { describe, expect, it } from 'vitest';
// `?raw` rather than node:fs, so the app tsconfig keeps `types: ["vite/client"]`
// and app code cannot reach for Node APIs by accident.
import homeSource from './Home.tsx?raw';

/**
 * A source-level guard against a specific mistake that reached production.
 *
 * While building slices 15-18 I repeatedly patched an auto-start into
 * `Home.tsx` so headless screenshots could reach mid-session states, then
 * reverted it. One revert did not happen and the hack shipped in 596b077:
 * every visitor began a breathing session ~50ms after load, without ever
 * pressing Begin.
 *
 * Nothing caught it — not the type checker, not lint, not 81 unit tests, and
 * not a single screenshot, because a screenshot of an auto-started session is
 * precisely what I had been trying to capture. A session must only ever begin
 * from an explicit user action.
 */
describe('Home has no automatic session start', () => {
  it('never calls start() from a timer', () => {
    expect(homeSource).not.toMatch(/setTimeout\s*\(\s*\(\s*\)\s*=>\s*start\s*\(/);
    expect(homeSource).not.toMatch(/setInterval\s*\(\s*\(\s*\)\s*=>\s*start\s*\(/);
  });

  it('never calls start() from inside an effect', () => {
    const effectBodies = homeSource.match(/useEffect\(\(\) => \{[\s\S]*?\n {2}\}, \[/g) ?? [];
    expect(effectBodies.length).toBeGreaterThan(0);
    for (const body of effectBodies) {
      expect(body).not.toMatch(/(^|[^a-zA-Z.])start\s*\(\s*\)/);
    }
  });
});
