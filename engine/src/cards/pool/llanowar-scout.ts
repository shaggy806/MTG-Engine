import { defineCard } from "../define.js";

// EDHREC rank 6271.
//
// Rulings:
//   [2018-04-27] Llanowar Scout’s effect doesn’t count as playing a land. It can put a land card
//     onto the battlefield even if you’ve already played as many lands as able this turn or if
//     it’s not your turn.

export default defineCard({
  name: "Llanowar Scout",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Scout"],
  power: 1,
  toughness: 3,
  text: "{T}: You may put a land card from your hand onto the battlefield.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      // Not a land play (the ruling) — Arboreal Grazer's shape, untapped.
      effect: {
        kind: "look-and-choose",
        zone: "hand",
        min: 0,
        max: 1,
        destination: "battlefield",
        leftover: "stay",
        filter: { type: "land" },
      },
      resolve: null,
      text: "{T}: You may put a land card from your hand onto the battlefield.",
    },
  ],
});
