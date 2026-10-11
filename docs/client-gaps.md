# Client / UI gaps

The detail behind `BACKLOG.md`'s "Client / UI" items: what the client can't show or ask yet,
and the cleanups found along the way. `BACKLOG.md` keeps one line per item under the same bold
title; when one lands, delete it in both. The animation follow-ups are in
`docs/plans/legibility-of-play.md`, "Follow-ups".

- **A few views still move on a click** (the jitter sweep, 2026-10-10, after the in-game
  ones were fixed — the Pass row, decision panel, phase pips, hand row, History, zone viewer,
  split menus, player panel badges, lobby, library overlay and scroll boxes). What's left, each
  a smaller or rarer shift:
  - **The landing page** (`lobby/landing.css`, `justify-content: safe center`): a join error,
    the blitz paste box, its progress bar and error each add height, and the centred column
    moves by half of it. A top-anchored column with fixed room for the notices would hold it.
  - **The deck builder's legality list** (`deck-builder/DeckEditor.tsx`): its problems (up to
    seven rows) come and go as cards are added, moving everything under it; a fixed-height
    box, or the problems as a count with a popover, would hold it. Also small label changes
    there ("Make active" → "Active", the "Delete…" confirm, "Import" → "Importing…").
  - **A stack entry's label** (`ui/Stack.tsx`): one that wraps to two lines draws its card a
    line lower, so the top card's place moves as the top changes. One line with an ellipsis
    (the full text in its title), or two lines kept for every label.
  - **The Game menu's confirms** (`ui/SeatMenu.tsx`): "Concede…" → "Concede the game?
    [Concede] [Cancel]" widens the right-anchored panel; a min-width for the longest would
    hold it.
  - **A decision prompt that wraps** grows the bottom-right panel upward a line (its width and
    buttons now hold still): at four players, picking an attacker adds "· click who they
    attack". Two lines kept for every prompt would cost every decision a line of board.
  - **Toasts**: an error is inserted above the sticky blitz report and the highroll notice,
    pushing them down. Also the stand-in review and printing picker re-centring as they step
    or load, and the scenario builder's notice above its results.
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
  cost. Each would be an opt-in room setting, off by default, since the engine otherwise follows
  the Comprehensive Rules exactly: a field in the lobby's `RoomSettingsPanel` and a key on
  `protocol`'s `RoomSettings`, checked in `PendingRoom.setSettings` and applied in
  `toGameConfig`, as starting life and the first player are.
- **Server-side deck save and share** is still unscoped. Decks live in `localStorage`.
- **The library and the deck builder load every card definition.** Both fetch all 32 card
  shards (`client/src/cards/cardData.ts`): about 3.1 MB, 610 kB gzipped, at 5,400 cards, and
  growing with the pool. They read only printed fields, each ability's text (colour identity)
  and the tokens a card makes. A generated catalog of just those, sharded the same way, would be
  a fraction of the size. The game page loads no definitions up front.
- **Copied triggers without targets aren't condensed on the stack** (the user, 2026-10-07).
  The user wants triggers that are copies of one another and have no targets shown as one stack
  entry, the way identical triggers already fold into one counted entry (`stackCount`). Scute
  Swarm is the example: each copy of it triggers on its own landfall, and the triggers stand as
  separate entries. Where the fold is decided hasn't been looked up yet.
- **"Same for all" covers only a trigger's yes-or-no "you may"**
  (`GameState.standingModeAnswers`). Not yet: a resolving trigger's choice among several modes, a
  "you may" asked after another decision in the same resolution (it parks, and loses
  `Game.resolvingTrigger`), the second player of an "each player may", and a trigger an effect
  granted (`grantedAbility` kind `modifier`, which has no signature).
- **The library's card viewer has no printings panel** (the user's ask, 2026-10-09). Add "just
  a scrollable list of all the sets/printings of a card"; clicking a printing changes the
  displayed one to it. Also keep the next/previous buttons still: today they move as the
  viewer box grows and shrinks with whether the card has associated tokens.
  `client/src/library/LibraryPage.tsx`, `library.css`.
- **The top strip still clips the phase track at 1024 wide** (2026-10-06 UI review). Moving bot
  speed into the Settings panel brought every step back at 1366x768, but at 1024 the track
  (`PhaseTrack`) still stops short: at EC on 2026-10-09, with the turn banner's round (added
  that day) already shortened to "R3" below 75rem. "Player 1 to act" and the text buttons
  (Settings, History, Capture, Seat) are what's left to shorten — icons, or the acting player
  folded into the turn banner.

**A forced look-and-choose still asks**

Yuriko, the Tiger's Shadow and Dark Confidant reveal the top card and put it into your hand: a
`look-and-choose` over the library with `count: 1, min: 1, max: 1`, so the zone picker opens on one
card that must be taken (seen live 2026-10-09). The engine could skip the `choose-from-zone` when
the eligible cards are exactly `min` = `max` and there's no order to pick (`Game`'s look-and-choose,
where the decision is raised); bots and the fuzzer answer it already.
