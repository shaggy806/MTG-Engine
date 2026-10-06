# Bot misplays from live games

Misplays the user saw on the live site that couldn't be captured, each rebuilt as a scenario in
`engine/src/bot/scenarios.ts` (the `bot-misplay` skill). Newest first. An entry stays until its
scenario passes and moves to the gate; then mark it `fixed` with the commit, or delete it.

## 2026-10-05 — an untapped land over Glacial Fortress on turn one

- **Seen:** on turn one a bot played its untapped land over a Glacial Fortress (tapped, with no
  Plains or Island out). The untapped land made Sticky Fingers castable, but it had nothing of
  its own to enchant.
- **Right:** the Fortress, tapped, now. The user: "A land letting you cast a spell is of no value
  if you wouldn't cast the spell if you had the mana."
- **Scenario:** "plays Glacial Fortress tapped on turn one over a Mountain for nothing it would
  cast" (gate).
- **Why:** `bestLand`'s `castableAfter` counted every spell the engine called castable, Sticky
  Fingers at an opponent's creature included; and its tapped-land tie-break skipped check lands,
  whose tapped-ness is a condition.
- **Fix:** `castableAfter` (and the shock land's `payLifeForUntapped`) count only what v1 would
  cast (`wouldCast`, the filter `act` casts from), and `entersTapped` reads a check land's
  condition on the board as it is (`staticConditionMet`).
- **Status:** fixed.

## 2026-10-05 — a land sacrificed untapped (the user's rule)

- **Rule:** "spells that sacrifice lands should always prioritize tapped lands."
- **Scenario:** "sacrifices a tapped land to Harrow" (gate).
- **Why:** `cheapestPermanents` ranked by value alone, so a tapped and an untapped Forest tied
  to the first listed. And the engine paid a cast's mana before its sacrifice (rule 601.2g–h)
  without knowing which land was going, so it could tap the others and sacrifice one untapped.
- **Fix:** among the lands it may give up, a tapped one goes first (the lands keep the places
  the value ranking gave them, so a mixed choice still gives up the cheapest); and a single
  sacrificed permanent pays the spell's mana first where it can (`ManaSourceArrangement.first`,
  `additional-costs.test.ts`).
- **Status:** fixed.

## 2026-10-05 — Explore held on turn two

- **Seen:** on its second turn, with a Forest and a Mountain out and two Swamps in hand, a bot
  passed with Explore in hand — nothing else in hand cost two.
- **Right:** cast Explore, play the second Swamp: three lands on turn two and a card back.
- **Scenario:** "casts Explore on turn two with a land to play off it" (gate since the fix).
- **Why:** Explore isn't a cantrip to `controller.ts`'s `isCardFlow` (an `additional-land-drop`
  is neither a draw nor a filter), so `isCantripDue` never plays it and v2's search decides. Its
  rollouts pass our seat for the rest of the turn, so the extra land is never played: two mana
  for a card back scores no better than passing, and passing is scored first.
- **Fix:** an extra land drop with a land in hand to use it is due like a cantrip — in
  `isCantripDue` (or beside it), count `additional-land-drop` as worth a card when the hand
  holds a land and this turn's drop is used or about to be, so the search's pass turns into the
  cast. Explore, Growth Spiral, Urban Evolution and the like. Might break: casting one with no
  land to follow (the hand check guards it), or ahead of a better two-drop the search did want
  (it only applies when the search would pass).
- **Status:** fixed, more simply: `isCardFlow` reads an `additional-land-drop` as neutral, so
  Explore and Urban Evolution are cantrips (`isCantripDue`), cast in our main phase when the
  search would pass, and the land drop that follows is the bot's usual land-first play.

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
- **Status:** fixed. v2's attack climb sends a stack in parts — one token more, the fewest that
  finish a planeswalker, or all it has left, smallest first so a tie keeps the leaner attack.
  That alone sent the other eight at the walker's controller, since `untappedCreatures` counted
  only blockers that hold an attacker off alone. The user: "in most cases you want to keep at
  least a few blockers back if there are creatures on opponents' boards". `deterringBlockers`
  now counts small blockers in gangs that kill an attacker together, as many as the opponent
  with the most attackers would take; the scenario (gate) sends 5 at Garruk, 2 at bob and keeps
  6 home against two opponents' three 2/2s each.

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
- **Status:** fixed (`colorToName` in `land-colors.ts`, v1's `chooseCreatureType` override);
  the scenario gates.

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
- **Found on the way:** `castableAfter` stopped at the Lair's colour choice and saw nothing
  castable behind it, so the Lair lost even to a land that cast no more. It now answers the
  choice (`legalActionsAfter` takes a sequence) and looks past it.
- **Status:** fixed (`bestLand`'s `entersTapped` tie-break); the scenario gates.

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
