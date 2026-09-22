import { defineCard } from "../define.js";

/**
 * Five activated abilities, one per colour, and none of them has `{T}` — so
 * a summoning-sick Kenrith can use every one of them the turn he arrives
 * (rule 302.6 only gates `{T}`/`{Q}` costs). None is a mana ability. Every
 * pip is printed in `text`, which is what makes his colour identity WUBRG
 * (rule 903.4) rather than mono-white.
 */
export default defineCard({
  name: "Kenrith, the Returned King",
  manaCost: "{4}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Noble"],
  power: 5,
  toughness: 5,
  text:
    "{R}: All creatures gain trample and haste until end of turn.\n" +
    "{1}{G}: Put a +1/+1 counter on target creature.\n" +
    "{2}{W}: Target player gains 5 life.\n" +
    "{3}{U}: Target player draws a card.\n" +
    "{4}{B}: Put target creature card from a graveyard onto the battlefield under its owner's control.",
  activated: [
    {
      // "**All** creatures" — every player's, so no `controlledBy`. The grant
      // lands on the creatures on the battlefield as it resolves and nothing
      // that enters later (rule 611.2c; Kenrith's 2019-10-04 ruling), which
      // is exactly `grant-keyword-all`'s per-permanent loop.
      cost: { mana: "{R}", tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "grant-keyword-all",
            filter: { type: "creature" },
            keyword: "trample",
            duration: "end-of-turn",
          },
          {
            kind: "grant-keyword-all",
            filter: { type: "creature" },
            keyword: "haste",
            duration: "end-of-turn",
          },
        ],
      },
      resolve: null,
      text: "{R}: All creatures gain trample and haste until end of turn.",
    },
    {
      // "Target creature" means whatever is a creature *right now*, so an
      // animated Mishra's Factory counts. The `"creature"` literal checks
      // printed types and would refuse it. The structured spec goes through
      // `matchesFilter`, which reads the computed (post-layer-4) types.
      cost: { mana: "{1}{G}", tap: false },
      targets: [{ kind: "permanent", filter: { type: "creature" } }],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "{1}{G}: Put a +1/+1 counter on target creature.",
    },
    {
      // `toControllerOfTarget` on a *player* ref is that player
      // (`EffectApi.controllerOf`), so this is exactly "target player gains".
      cost: { mana: "{2}{W}", tap: false },
      targets: ["player"],
      effect: { kind: "gain-life", amount: 5, toControllerOfTarget: 0 },
      resolve: null,
      text: "{2}{W}: Target player gains 5 life.",
    },
    {
      cost: { mana: "{3}{U}", tap: false },
      targets: ["player"],
      effect: { kind: "draw", amount: 1, target: 0 },
      resolve: null,
      text: "{3}{U}: Target player draws a card.",
    },
    {
      // Any graveyard (the 2023-04-14 ruling), and under its **owner's**
      // control — no `underYourControl`, so the card simply enters as its
      // owner's permanent (rule 110.2) and stays when Kenrith's controller
      // leaves the game.
      cost: { mana: "{4}{B}", tap: false },
      targets: [{ kind: "card-in-graveyard", filter: { type: "creature" } }],
      effect: { kind: "put-onto-battlefield", target: 0 },
      resolve: null,
      text: "{4}{B}: Put target creature card from a graveyard onto the battlefield under its owner's control.",
    },
  ],
});
