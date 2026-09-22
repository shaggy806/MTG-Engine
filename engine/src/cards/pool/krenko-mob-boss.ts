import { defineCard } from "../define.js";

// Commander backlog #6 by deck count (top-commanders.txt) — the first of the
// most-played commanders authored off that list.
//
// The whole card is one activated ability whose token count is a live board
// count, which `create-token`'s `EffectAmount` already expresses as
// `{ countOf }`. It counts *Goblins you control* including Krenko himself,
// and including the tokens from previous activations — so it doubles every
// turn, which is the card.
export default defineCard({
  name: "Krenko, Mob Boss",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Goblin", "Warrior"],
  power: 3,
  toughness: 3,
  text: "{T}: Create X 1/1 red Goblin creature tokens, where X is the number of Goblins you control.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "create-token",
        token: "Goblin Token",
        count: { countOf: { subtype: "Goblin", controlledBy: "you" } },
      },
      resolve: null,
      text: "{T}: Create X 1/1 red Goblin creature tokens, where X is the number of Goblins you control.",
    },
  ],
});
