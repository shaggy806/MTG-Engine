import { defineCard } from "../define.js";

// Any creature dealing combat damage to one of your opponents — yours or
// another opponent's — lets its controller pay 1 life to draw. The cards the
// second ability exiles are played as it resolves, any number of them, one
// after another, or never (the ruling): spells without paying their mana
// costs (X is 0), a land only during your turn with a land play left (the
// rulings).
const DRAW_TEXT =
  "Whenever a creature deals combat damage to one of your opponents, its controller may pay 1 life. If they do, they draw a card.";
const EXILE_TEXT =
  "{4}{B}{B}{B}, Discard X cards: Exile the top X cards of target opponent's library. You may play lands and cast spells from among cards exiled this way without paying their mana costs.";

export default defineCard({
  name: "Gix, Yawgmoth Praetor",
  manaCost: "{1}{B}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Praetor"],
  power: 3,
  toughness: 3,
  text: `${DRAW_TEXT}\n${EXILE_TEXT}`,
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "any", filter: { type: "creature" }, toOpponent: true },
      targets: [],
      effect: {
        kind: "each-player-may",
        who: "trigger-controller",
        options: [{ payLife: 1, text: "Pay 1 life" }],
        ifDid: { kind: "draw", amount: 1, who: "that-player" },
      },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{4}{B}{B}{B}", tap: false, discard: { count: "x" } },
      targets: ["opponent"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "exile-from-library", whose: 0, amount: "x" },
          { kind: "cast-now", from: "exiled-this-way", play: true, free: true, repeat: true },
        ],
      },
      resolve: null,
      text: EXILE_TEXT,
    },
  ],
});
