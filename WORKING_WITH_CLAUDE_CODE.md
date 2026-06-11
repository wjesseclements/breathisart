# Working With Claude Code on This Project

A practical playbook for building Stillpoint with Claude Code. Official docs: https://code.claude.com/docs/en/best-practices

## Setup (once)
1. Create the repo, drop `CLAUDE.md` and `PRD.md` in the root, commit them.
2. In the repo, run `claude`, then `/init` if you want Claude to augment CLAUDE.md after scaffolding exists. Keep CLAUDE.md under ~200 lines — it's loaded every session, so it's a tax on every conversation.
3. Set permissions to taste: `/permissions` to allowlist routine commands (`npm run test`, `npm run lint`), or use auto-accept mode once you trust the direction. Reserve manual approval for `git push` and anything destructive.

## The core loop: Plan → Build → Verify
This is the single highest-leverage habit.

1. **Plan first.** Start big tasks in plan mode (Shift+Tab to toggle, or ask "make a plan, don't write code yet"). For this project, the first prompt should be roughly:
   > Read PRD.md and CLAUDE.md. Propose a build plan as a series of small vertical slices, each independently runnable and testable. Write it to PLAN.md with checkboxes. Don't write any code yet.
   Review PLAN.md yourself. Fix the plan, not the code — it's 10x cheaper.
2. **Build one slice at a time.** "Implement slice 1 from PLAN.md" — not "build the app." Suggested slice order: scaffold + CI → breath engine + tests → static pacer rendering one pattern → pattern picker → settings drawer → custom pattern builder → audio/haptics → research page → PWA → polish pass.
3. **Verify every slice.** Make Claude run lint/test/build itself, then *you* open the dev server and actually breathe with it. Animation feel can't be code-reviewed.

## Context management (the #1 failure mode)
- `/clear` between unrelated tasks. A long polluted context makes Claude measurably worse.
- `/compact` at natural breakpoints in long tasks if you need continuity.
- Externalize state to files (PLAN.md with checked boxes, notes in CLAUDE.md) instead of relying on conversation memory. Then any fresh session can resume with "read PLAN.md and continue."
- If Claude starts flailing — repeated failed fixes, contradicting itself — stop, `/clear`, and restate the problem cleanly with the relevant file paths. Don't argue with a degraded context.

## Prompting patterns that work well here
- **Give targets, not vibes, for the visual.** "Orb scales 1.0→1.35 over the inhale with a sinusoidal ease, three halo layers at 0.9x/0.8x/0.7x of the scale delta, 60fps, transform/opacity only" beats "make it pretty and smooth." When you can't specify, iterate: screenshot or describe what feels off ("the hold phase feels dead — add a slow 4s shimmer").
- **Paste errors verbatim.** Full stack traces, full console output. Don't summarize them.
- **Course-correct early.** Hit Esc to interrupt the moment you see it going the wrong direction; don't let it finish a wrong approach.
- **Ask for self-review.** After a slice: "Review the diff you just made against the architecture rules in CLAUDE.md. Anything that violates them?" Catches a surprising amount.
- **Use it for the boring excellence**: "Write the meta/OG tags," "audit the app against WCAG for the session screen," "add the GitHub Actions workflow that runs lint+test+build on PRs."

## Git hygiene
- Commit after every working slice. Small commits are your undo button when an agent goes sideways.
- Let Claude write commits, but read the diff (`git diff` or the IDE) before approving pushes.
- Use a branch per slice if you want PR previews on Vercel — nice for checking animation on your actual phone.

## When Claude gets it wrong repeatedly
- Add the correction to CLAUDE.md so it never comes back ("don't use setTimeout for phases" lives there for a reason). Refining CLAUDE.md based on real mistakes is the maintenance loop that makes the tool feel smart.
- If a rule absolutely must hold every time (e.g., run Prettier on save), make it a hook in `.claude/settings.json` rather than a CLAUDE.md sentence — CLAUDE.md is advisory; hooks are deterministic.

## Mobile reality check
This app lives or dies on a phone. Every couple of slices: deploy a preview, open it on your phone, check fps, tap targets, wake lock, haptics, and how it feels in a dark room. Tell Claude exactly what you observed.
