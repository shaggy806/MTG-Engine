# Bot misplays from live games

Misplays the user saw on the live site that couldn't be captured, each rebuilt as a scenario in
`engine/src/bot/scenarios.ts` (the `bot-misplay` skill). Newest first. An entry stays until its
scenario passes and moves to the gate; then mark it `fixed` with the commit, or delete it.

## 2026-10-04 — Jaddi Offshoot after the land drop

- **Seen:** on turn 2 a bot played a Swamp, then cast Jaddi Offshoot.
- **Right:** cast the Offshoot off its Forest first; the Swamp's landfall then gains a life.
- **Scenario:** "casts Jaddi Offshoot before its land drop" (training, reproduces).
- **Why:** both bots play a land before anything else whenever one can be played. v2 returns
  the only land outright (`bot/eval-bot.ts`, `lands.length === 1`) and scores several only
  against each other; v1's `act` plays `bestLand` first. Nothing ever weighs "a spell, then the
  land".
- **Likely fix:** when a castable spell in hand doesn't need the land drop's mana and a permanent
  it would put down (or one on the board) has a landfall trigger, offer casting it first as a
  candidate beside the land. Risk: holding the land back can cost a spell that needed the extra
  mana; the candidate has to be scored, not ruled.
- **Status:** open.

## 2026-10-04 — Stomping Ground played tapped over a Forest for Birds of Paradise

- **Seen:** with Forest, Mountain, Stomping Ground and Birds of Paradise in hand, a bot played
  Stomping Ground, let it enter tapped, and couldn't cast the Birds.
- **Right:** play the Forest and cast the Birds (no life spent).
- **Scenario:** "plays a Forest for Birds of Paradise, not a tapped Stomping Ground" — **passes on
  the current build**, so it went straight to the gate. The land ranking learned "the land that
  lets you cast a spell this turn" on 2026-10-01 (95fe54c5); the site was most likely running an
  older build.
- **Found on the way — open:** neither bot ever pays a shock land's 2 life
  (`AutomaticController.payLifeForUntapped` returns false and nothing overrides it), and v1's
  `castableAfter` can't see a spell behind a shock land, since playing one stops at the pay
  decision. Scenario "pays 2 life for an untapped Stomping Ground to cast Birds of Paradise"
  (training, reproduces). Likely fix: pay when the untapped land casts a spell this turn that
  the tapped one wouldn't, and life is above the danger line — priced like any other life
  payment (`lifeCost`).
- **Status:** the report: not reproduced (fixed before it was seen). The shock-land payment: open.
