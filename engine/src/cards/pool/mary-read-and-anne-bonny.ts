import { defineCard } from "../define.js";

// EDHREC rank 5352.
// Makes Treasure → use "Treasure Token".
//
// Rulings:
//   [2024-07-05] If you discard a card with one or more of the types  listed in Mary Read and Anne
//     Bonny’s last ability, the ability will still trigger only once for that discarded card.

export default defineCard({
  name: "Mary Read and Anne Bonny",
  manaCost: "{1}{U}{R}",
  colors: ["U", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Assassin", "Pirate"],
  power: 3,
  toughness: 3,
  keywords: ["haste"],
  text: "Haste\n{T}: Draw a card, then discard a card.\nWhenever you discard an Island, Pirate, or Vehicle card, create a tapped Treasure token.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [{ kind: "draw", amount: 1 }, { kind: "discard", target: "you", amount: 1 }],
      },
      resolve: null,
      text: "{T}: Draw a card, then discard a card.",
    },
  ],
  triggered: [
    {
      // Once per discarded card, however many of the three subtypes it has
      // (the ruling).
      trigger: {
        on: "discards",
        who: "you",
        perCard: true,
        filter: { subtypes: ["Island", "Pirate", "Vehicle"] },
      },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1, tapped: true },
      resolve: null,
      text: "Whenever you discard an Island, Pirate, or Vehicle card, create a tapped Treasure token.",
    },
  ],
});
