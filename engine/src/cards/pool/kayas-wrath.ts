import { defineCard } from "../define.js";

// EDHREC rank 4315.
//
// Rulings:
//   [2019-01-25] If a creature you control has indestructible, it isn't destroyed this way and you
//     won't gain life for it. If a creature you control is destroyed but put into a zone other
//     than a graveyard, you will gain life for it.

export default defineCard({
  name: "Kaya's Wrath",
  manaCost: "{W}{W}{B}{B}",
  colors: ["W", "B"],
  types: ["sorcery"],
  text: "Destroy all creatures. You gain life equal to the number of creatures you controlled that were destroyed this way.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "destroy-all", filter: { type: "creature" } },
      // "Destroyed" counts a creature a replacement sent elsewhere (the ruling);
      // whose it was is its controller as it left (Deadly Tempest's shape).
      { kind: "gain-life", amount: { thisWay: "destroyed", who: "you" } },
    ],
  },
});
