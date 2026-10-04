import { defineCard } from "../define.js";

// EDHREC rank 4514.
//
// Rulings:
//   [2021-06-18] Cascade triggers when you cast the spell, meaning that it resolves before that
//     spell. If you end up casting the exiled card, it will go on the stack above the spell with
//     cascade.
//   [2021-06-18] If a spell with cascade is countered, the cascade ability will still resolve
//     normally.

export default defineCard({
  name: "Maelstrom Colossus",
  manaCost: "{8}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Golem"],
  power: 7,
  toughness: 7,
  text: "Cascade (When you cast this spell, exile cards from the top of your library until you exile a nonland card that costs less. You may cast it without paying its mana cost. Put the exiled cards on the bottom in a random order.)",
  triggered: [
    {
      trigger: { on: "this-cast" },
      targets: [],
      effect: { kind: "cascade" },
      resolve: null,
      text: "Cascade",
    },
  ],
});
