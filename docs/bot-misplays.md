# Bot misplays from live games

Misplays the user saw on the live site that couldn't be captured, each rebuilt as a scenario in
`engine/src/bot/scenarios.ts` (the `bot-misplay` skill). Newest first. An entry stays until its
scenario passes and moves to the gate; then mark it `fixed` with the commit, or delete it.

## 2026-10-05 — thirteen tokens at a five-loyalty planeswalker

- **Seen:** a bot attacked a planeswalker with 5 loyalty with all thirteen of its creature
  tokens.
- **Right:** five kill it; the other eight stay home as blockers.
- **Scenario:** "sends only enough of a token stack to kill a planeswalker" (training) — sends
  all 13 at Garruk, keeps none home.
- **Why:** neither bot can send part of a token stack. v2's attack climb (`bot/eval-bot.ts`,
  `declareAttackers`) adds one `{ attacker, defender }` at a time with no `count`, so a stack
  goes whole or not at all; v1's swing (`controller.ts`) declares whole stacks too. Only the
  kill planner (`alphaStrike`) splits stacks, and it plans kills on players, not planeswalkers.
  So the choice was 13 or 0, and 13 scored better.
- **Fix:** give the climb a move that sends `count` tokens of a stack — the fewest that kill a
  planeswalker or player through its blockers, and one more token at a time after that — as the
  blockers' climb already moves one token of a stack per step. Might break: more simulations per
  attack on wide token boards (the climb's budget is per simulation), and the crackback check
  then decides how many stay home, so it inherits that check's gaps (BACKLOG).
- **Status:** open.

## 2026-10-05 — Valgavoth's Lair named white in a Temur deck

- **Seen:** a Temur bot played Valgavoth's Lair and chose white.
- **Right:** a colour of its own deck — red here, for the dragons' {R}{R}{R}.
- **Scenario:** "names a colour its deck plays for Valgavoth's Lair" (training) — chooses W.
- **Why:** an "as this enters, choose a colour" (`chooseOnEnter`) is asked as a
  `choose-creature-type` over the five colours. Its `suggested` list is only computed for the
  creature-type catalog (`decisions/choose-creature-type.ts`), so it's empty, and every
  controller answers `suggested[0] ?? options[0]` — white, every time. Neither bot overrides
  it. The Thriving lands (`helpers.ts`, `chooseOnEnter: others`) take the first option too.
- **Fix:** when every option is a colour, v1's `chooseCreatureType` names the colour the hand's
  pips want most that the lands on the battlefield don't already make (`bestLand`'s tallies),
  within the commander's colour identity, falling back to the identity's first colour. v2
  inherits it. Low risk: today's answer is never deliberate.
- **Status:** open.

## 2026-10-05 — untapped Forest played over a tapped Valgavoth's Lair

- **Seen:** a Temur dragons bot on four lands played a Forest while holding Valgavoth's Lair,
  with nothing in hand a fifth untapped mana could cast.
- **Right:** play the Lair now, while entering tapped costs nothing; the Forest comes down untapped
  on a turn it's needed (and Rorix Bladewing's {R}{R}{R} isn't a turn later).
- **Scenario:** "plays its tapped land when the untapped one casts nothing more" (training) —
  chooses the Forest.
- **Why:** v1's `bestLand` ranks by `castableAfter` (equal: Heroic Intervention either way),
  then by pips no land on board pays — the Lair's `"chosen"` mana counts for no colour in
  `colorsProducedBy`, so the Forest's green wins. Nothing weighs "enters tapped". v2's land search
  tries v1's pick first, and its rollouts pass our seat, so every land ties and v1's stands.
- **Fix:** in `bestLand`, among lands with the same `castableAfter`, prefer one that enters
  tapped (ahead of the pip score), and count a chosen-colour land as making any colour the
  identity allows. Might break: a tapped land played when the untapped one would have held up
  an instant — `castableAfter` already counts instants castable now, so that tie shouldn't
  arise; worth a `bot:diff`.
- **Status:** open.

## 2026-10-04 — Jaddi Offshoot after the land drop

- **Seen:** on turn 2 a bot played a Swamp, then cast Jaddi Offshoot.
- **Right:** cast the Offshoot off its Forest first; the Swamp's landfall then gains a life.
- **Scenario:** "casts Jaddi Offshoot before its land drop" (gate since the fix).
- **Why:** both bots play a land before anything else whenever one can be played. v2 returns
  the only land outright (`bot/eval-bot.ts`, `lands.length === 1`) and scores several only
  against each other; v1's `act` plays `bestLand` first. Nothing ever weighs "a spell, then the
  land".
- **Fix:** a permanent with its own landfall trigger that's castable now goes before the land
  drop, in both bots (`controller.ts`'s `isLandfallPermanent`; v2 only from its own candidates,
  so its holds still apply). Mana is the same in either order, so it costs nothing.
- **Status:** fixed (`bot:diff` over 12 four-player games: 4 of 28,314 decisions, each a landfall
  permanent before the land — Avenger of Zendikar, Floral Evoker, Jaddi Offshoot).

## 2026-10-04 — Stomping Ground played tapped over a Forest for Birds of Paradise

- **Seen:** with Forest, Mountain, Stomping Ground and Birds of Paradise in hand, a bot played
  Stomping Ground, let it enter tapped, and couldn't cast the Birds.
- **Right:** play the Forest and cast the Birds (no life spent).
- **Scenario:** "plays a Forest for Birds of Paradise, not a tapped Stomping Ground" — **passes on
  the current build**, so it went straight to the gate. The land ranking learned "the land that
  lets you cast a spell this turn" on 2026-10-01 (95fe54c5); the site was most likely running an
  older build.
- **Found on the way:** neither bot paid a shock land's 2 life
  (`AutomaticController.payLifeForUntapped` returns false and nothing overrides it), and v1's
  `castableAfter` can't see a spell behind a shock land, since playing one stops at the pay
  decision. Scenario "pays 2 life for an untapped Stomping Ground to cast Birds of Paradise".
  **Fixed:** v1's `payLifeForUntapped` pays when the untapped land casts more spells this turn
  than the tapped one (`legalActionsAfter` both ways) and life stays above 15 after paying; v2
  takes v1's answer, since its rollouts pass our seat for the rest of the turn and never see the
  spell. "Lets Stomping Ground enter tapped with nothing to cast" holds the other side.
- **Status:** the report: not reproduced (fixed before it was seen). The shock-land payment: fixed.
