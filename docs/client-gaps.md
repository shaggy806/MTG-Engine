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
- **"Same for all" covers only a trigger's yes-or-no "you may"**
  (`GameState.standingModeAnswers`). Not yet: a resolving trigger's choice among several modes, a
  "you may" asked after another decision in the same resolution (it parks, and loses
  `Game.resolvingTrigger`), the second player of an "each player may", and a trigger an effect
  granted (`grantedAbility` kind `modifier`, which has no signature).
- **A revealed top card of a library has no hover card** (the user, 2026-10-07). When a
  player's top card is revealed (`.library-top`, drawn in `App.tsx`), hovering it should show a
  blown-up version of the card, the way hovering a battlefield tile does (`MiniTile`'s popover,
  `useHoverPopover`).
- **Hover effects reset when another player plays a card** (a bug report, 2026-10-07). With
  the pointer resting on a card in hand, every card another player plays makes that card's
  grow-on-hover animation (`.hand-cards .hand-card:hover .card-tile` in `App.css`, a 0.15s
  scale/translate/rotate transition) play again; the user adds that hover effects on other cards
  (the battlefield tiles' hover popovers, `MiniTile`/`useHoverPopover`) reset the same way. That
  it reaches both points at one shared cause rather than the hand's own CSS. Not yet reproduced. The hand's keys are
  stable (`key={id}` in `App.tsx`'s hand row), so the leads are: something remounting the
  `.card-tile` or a parent of the hand row on the view update (Chrome re-hit-tests `:hover` after
  layout, so a fresh element starts unhovered and transitions up), or the play animation
  (`AnimationLayer.tsx`) briefly covering the hand with an element that takes the pointer.
  Reproduce in a dev room with the pointer parked on a hand card while a bot casts, recording
  frames.
- **The top strip still clips the phase track at 1024 wide** (2026-10-06 UI review). Moving bot
  speed into the Settings panel brought every step back at 1366x768, but at 1024 the track
  (`PhaseTrack`) still stops at CD. "Player 1 to act" and the text buttons (Settings, History,
  Capture, Seat) are what's left to shorten — icons, or the acting player folded into the turn
  banner.
