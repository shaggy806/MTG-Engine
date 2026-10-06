# Client / UI gaps

The detail behind `BACKLOG.md`'s "Client / UI" items: what the client can't show or ask yet,
and the cleanups found along the way. `BACKLOG.md` keeps one line per item under the same bold
title; when one lands, delete it in both. The animation follow-ups are in
`docs/plans/legibility-of-play.md`, "Follow-ups".

- **A gift's opponent is asked one opponent at a time** (rule 702.174a): with two or more
  opponents the caster answers a yes-or-no `choose-modes` `about` each in turn, the last one
  left taking it. One prompt naming every opponent (picked on their panels) would read better;
  the engine side is `promptNextGift`.
- **What the scenario builder can't say yet** (`docs/plans/scenario-builder.md`). A
  `ScenarioSpec` has no controller apart from the owner (a stolen permanent), no transformed or
  face-down card, no damage marked, no effects lasting a turn, nothing on the stack, and no turn
  number (play starts on turn 1, though `active`/`step` set whose turn and which step) — so
  "Edit from here" leaves all of those behind. A commander placed in a library goes to its
  bottom, whatever its place in the list. Each is a field on `ScenarioCard`/`ScenarioSpec` and a
  step in `server/src/builder.ts`'s `buildScenario` and `snapshotScenario`.
- **A creature's total toxic value isn't in the player view.** `Characteristics.toxic` (rule
  702.164b) isn't a `Keyword`, so `VisibleObject.keywords` leaves it out: a Rat that
  Karumonix, the Rat King gives toxic 1 shows nothing, and only a printed "Toxic N" is readable,
  in the card's text. The view needs a `toxic` field and the board a badge for it.
- **"Choose an opponent" names seats, not players.** `choose-opponent` (Tasigur, the Golden
  Fang) asks with a `choose-modes` whose texts are "Choose Bob" — the capitalised seat id — and
  the popup prints mode texts as they are, so a player with a display name is offered by the
  wrong one. The modes need to say which player each is, for the client to label with
  `playerLabel`.
- **Face-down permanents should sit on their controller's board, and turning one face up should
  work like any other activated ability** (the user's ask): a click on the card opens the same
  little menu another permanent's activated abilities use, with "turn face up" in it when the
  card can be turned face up. Blocked on the engine: there are no face-down permanents yet
  (morph, manifest and cloak are "Not modeled").
- **One art-crop primitive (from the 2026-09-28 rendering audit).** The client draws a card
  eleven ways: `CardTile` in two layouts (title: stack, zone viewer, every hover card;
  art-first: hand, library top, cast spotlight, reveals), `MiniTile` (battlefield),
  `CommanderTile` (command zone), `CommanderDamageChip`, the card back, `CardImage` (library,
  replacement review), the lobby's `CommanderArt`, `PrintingPicker`'s thumbnails, the deck
  builder's text rows and the landing hero. Each shape answers a size the others can't, so
  merging them isn't worth it. What is duplicated is the art lookup:
  `queueArtLookup` / `isArtPending` / `resolveArtUrl` / `recordArtFailure` and the tint
  fallback, repeated in `CardTile`, `MiniTile`, `CommanderTile`, `CommanderDamageChip`,
  `CardImage` and `deck-builder/ReplacementReview.tsx` (`CommanderArt` only resolves a URL).
  Extract one `ArtCrop` component; and `PrintingPicker`'s raw `<img>` could be a `CardImage`.
- **Large live mana amounts by hand.** "X mana in any combination" offers every split as its
  own menu entry only while the list stays small (two colours up to X = 22). Past that it
  offers all of one type per type, and a count picker would let the player choose any split.
  And when the payer taps such a source for more than a payment needs, the player can't choose
  the colour of what floats. The rest of `effect:mana-ability-dynamic-amount` is built.
- **Quality-of-life room options (house rules).** Options the room creator can turn on before a
  game that are technically against the rules but make play smoother. The user's example: mana
  that, when tapped, doesn't have its colour decided until it's spent on a specific coloured
  cost. Each would be an opt-in room setting (the lobby, `server/src/room.ts`), off by default,
  since the engine otherwise follows the Comprehensive Rules exactly.
- **Server-side deck save and share** is still unscoped. Decks live in `localStorage`.
- **The library and the deck builder load every card definition.** Both fetch all 32 card
  shards (`client/src/cards/cardData.ts`): about 3.1 MB, 610 kB gzipped, at 5,400 cards, and
  growing with the pool. They read only printed fields, each ability's text (colour identity)
  and the tokens a card makes. A generated catalog of just those, sharded the same way, would be
  a fraction of the size. The game page loads no definitions up front.
- **Long rules text is hidden behind the creature stat line** (the user, 2026-10-03). The
  art-first layout fits its text to the box (hand, cast spotlight); the title layout
  (`CardTile.tsx`'s fit returns early for it: hover cards, the stack) doesn't fit at all, so
  Abdel Adrian's text still runs under its 4/4 box there. Long text should fit or shrink so the
  P/T box never covers it, in every layout.
- **"Same for all" covers only a trigger's yes-or-no "you may"**
  (`GameState.standingModeAnswers`). Not yet: a resolving trigger's choice among several modes, a
  "you may" asked after another decision in the same resolution (it parks, and loses
  `Game.resolvingTrigger`), the second player of an "each player may", and a trigger an effect
  granted (`grantedAbility` kind `modifier`, which has no signature).
- **A new attack arrow's head lands before its line.** An attack arrow draws itself in along
  its length (`arrow-draw`, `client/src/ui/ArrowLayer.tsx`), but its head is a marker on the
  same path, drawn whole from the first frame, so it sits on the defender before the line gets
  there. Resolving arrows put the head on a sliver path of its own that waits for the line
  (`.arrow-tip`); attack arrows could do the same.
- **The highroll notice should look like the other alerts** (the user, 2026-10-06). The
  "🎲 <player> won the highroll and goes first" notice at the start of a game (`App.tsx`) has a
  style of its own; the user wants it to look like the game's other alerts.
