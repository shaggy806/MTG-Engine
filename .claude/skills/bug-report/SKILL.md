---
name: bug-report
description: Take a bug report about anything but a bot's choices — the client (layout, animation, clicks, what's shown), the engine (a card or rule doing the wrong thing), or the server (rooms, seats, reconnects) — reproduce it, find the root cause, fix it with a test that fails without the fix and a live check for anything visible, and ship it; or, when the fix needs a feature or a design call, record it with a fix outline. Use when the user reports a bug, says something looks wrong or broke, sends a screenshot of a problem, or runs /bug-report. Bot misplays go to the `bot-misplay` skill instead.
---

# A bug report

The user plays on the live site (tobyens.com) and reports what they saw —
often one sentence and a screenshot. The goal is the cause, not the symptom,
then a fix that is proven and shipped.

## 1. Pin it down

From the report (and the screenshot — zoom into it: crop and enlarge the
region with Python/PIL rather than squinting), write down before touching
code:

- **What was seen**, and **what should happen** — for a rules question, the
  Comprehensive Rules say which (`docs/rules/MagicCompRules_*.txt`; grep the
  rule and cite its number). If the report contradicts the rules, say so with
  the rule rather than "fixing" it (the user's standing rule: rules accuracy
  is mandatory).
- **Which layer**: client (drawing, animation, input), engine (state, a
  card's definition, a rule), server (rooms, seats, views, timing). A client
  symptom often has an engine or view cause: check what the server sent
  (`viewFor`) before blaming the drawing.
- **The cards and board** involved. Ask the user only for what you can't
  reproduce without (one question, with your best guess offered).

If it's a bot's *choice* that's wrong, stop and use `bot-misplay`.

## 2. Reproduce it

- **Engine**: a short script against `engine/dist` (`Game.create`,
  `debugSpawn`, `dispatch`, `viewFor`) printing the state at each step, or a
  vitest case beside the mechanic's own test file (`engine/src/test/`). Read
  `engine/CLAUDE.md` first; `game.ts` greps need `grep -a`.
- **Client/server**: a dev room (`server/scripts/dev-scenarios.mjs`; add one
  for the case if none fits) and Playwright Chromium (`dev-up` with
  dev-rooms, or isolated `E2E_*` ports when another session holds 4000/5173),
  with screenshots at 1366x768, 1920x1080 and 2560x1440. For an animation,
  record frames at intervals rather than one screenshot.

A bug you can't reproduce isn't fixed by guessing: say what you tried and
what the next report should include.

## 3. Find the root cause

Read the file's entry in `docs/architecture/<engine|client|server>.md` before
changing it. Name the cause in one sentence (e.g. "the name strip's line box
came from the tile's 14px font, so the 11px name sat on its baseline"). If a
quick patch would hide the cause, fix the cause.

## 4. Fix it, decide, or record it

- **Contained fix**: make it, with a test that fails without it (break the
  fix once and watch it go red where a silent pass is plausible) — a vitest
  case for logic, an e2e spec or a unit test of the pure part for the
  client. Anything visible is checked live in the browser at the three sizes
  and in a 2- and a 3-4-player room (client/CLAUDE.md's rule).
- **Needs a feature or a design call**: don't build it unasked. One line in
  `BACKLOG.md` (and the detail in `docs/engine-gaps.md` or
  `docs/client-gaps.md` under the same bold title), with a fix outline:
  where, what, what it risks. Then ask.
- **A hand check is worth keeping** (a new player decision, a careful rules
  call): add an entry to `docs/manual-checks.md` with its board in
  `client/src/builder/manualChecks.ts`.

## 5. Ship

The `ship` skill: build, both test suites, typecheck, lint, fuzzer, the
Playwright smoke suite when the UI changed, CRLF/LF drift, docs (the
architecture entry for each changed file). Commit as
`<Layer>: <what was wrong, in the user's terms>` with "a bug report" and the
date in the body, and push.

## 6. Report

A few lines: the cause, the fix, how it was proven (test + live check), the
commit — or, if recorded instead, the outline and the question.
