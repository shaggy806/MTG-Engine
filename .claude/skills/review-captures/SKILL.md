---
name: review-captures
description: Go through the open bot captures (positions saved with the in-game Capture button, `captures/*.json`) — what each bot chose, what the user's note says it should have done, why v2 chose it (the saved search diagnosis and the code), which are already fixed on today's build — then outline a fix for each still-wrong one, fix the clear ones, and resolve what's fixed. Use when the user asks to look at, review, go through or triage the captures, the new captures, or bot captures from the site.
---

# Review the open captures

A capture is a position the user saved from a live game with a note saying
what the bot should have done. `bot:captures` replays each one against
today's build; the open ones are training scenarios, and a resolved one gates.
The deliverable is a short verdict and a fix outline per open capture, then
fixes for the ones whose cause is clear.

Bug reports filed from the same panel (`captures/bugs/`) aren't bot
choices: they go through the `bug-report` skill. Mention any unhandled
ones in the report so they aren't missed.

## 1. List them with today's answers

```bash
cd "$(git rev-parse --show-toplevel)/engine" && npm run build > /dev/null 2>&1 && npm run bot:captures > "$TEMP/caps.txt" 2>&1; cat "$TEMP/caps.txt"
```

Builds first: `bot:captures` replays `dist/`. Each open entry shows `right`
or `WRONG` today, the user's `note`, what v2 `now` chooses, and, for captures
saved since the diagnosis was added, `live:` — the search's path, its clock and
every candidate's score when it chose on the site. Newest captures are the
ones the user just asked about: sort by the timestamp in the file name, and
lead with them.

## 2. One verdict per capture

For each open capture, read the position before reasoning about it:

```bash
node -e 'const c=require(process.argv[1]); const st=c.state, me=c.player, nm=id=>st.objects[id]?.cardName;
console.log("note:", c.note); console.log("hand:", st.zones.perPlayer[me].hand.map(nm).join(", "));
console.log("board:", st.zones.shared.battlefield.filter(id=>st.objects[id].controller===me).map(id=>nm(id)+(st.objects[id].tapped?"(T)":"")).join(", "));
console.log("turn", st.turn.number, st.turn.step)' "$(git rev-parse --show-toplevel)/captures/<file>.json"
```

Then put it in one of these:

- **Fixed already** (`right` today, and today's answer is what the note
  wants, not just a different wrong one): name the commit that fixed it if
  you can (`git log -S` on the relevant function), and resolve it:
  `npm run bot:captures -w engine -- resolve <name part> --note "Fixed in <sha>: …; gate '<scenario>'"`.
  A capture that is `right` only because it now does something *else* wrong
  stays open, with that said.
- **Clear cause, contained fix**: find the code that chose it (as the
  `bot-misplay` skill's step 2 does: land drops `bestLand`/`castableAfter`,
  priority/attacks/blocks `bot/eval-bot.ts`, decisions `answerAwaited`), say
  in a sentence what the bot compared and why the wrong option won, and fix
  it with a gate scenario in `engine/src/bot/scenarios.ts` that fails before
  the fix (break it once to see it go red) — then resolve the capture.
- **Needs a feature or a design call** (a multi-step line the one-ply
  search can't see, a weight with trade-offs): don't build it unasked. Add
  one `BACKLOG.md` line under "Bots" — the capture's id, what it shows, and
  a fix outline (where in the code, what it would change, what it risks).
- **The user's note is arguable**: say so with the reason and the rule
  (cite the Comprehensive Rules where it's a rules point), and ask.

## 3. Ship what was fixed

The `ship` skill's checks; for bot changes, the gate (`bot:scenarios`) and a
`bot:diff` against `origin/main` that reads sane — no A/B bench unless asked
(the user's rule). Commit as `Bots: <what changed> (captures <ids>)`.

## 4. Report

A short table or list: each capture (who, turn, the note in a few words) →
verdict (fixed / fixed now / outlined / question), with the one-line reason.
Then what was committed, and the outlined fixes the user can pick from.
