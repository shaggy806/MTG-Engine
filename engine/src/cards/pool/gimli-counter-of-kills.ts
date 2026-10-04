import { defineCard } from "../define.js";

// EDHREC rank 6342.
//
// Rulings:
//   [2023-06-16] If Gimli, Counter of Kills dies at the same time as one or more creatures an
//     opponent controls, the last ability will trigger for each of those other creatures.

export default defineCard({
  name: "Gimli, Counter of Kills",
  manaCost: "{3}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dwarf", "Warrior"],
  power: 4,
  toughness: 3,
  keywords: ["trample"],
  text: "Trample\nWhenever a creature an opponent controls dies, Gimli deals 1 damage to that creature's controller.",
  triggered: [
    {
      trigger: { on: "dies", who: "any", filter: { type: "creature", controlledBy: "opponent" } },
      targets: [],
      effect: { kind: "damage", amount: 1, who: "trigger-controller" },
      resolve: null,
      text: "Whenever a creature an opponent controls dies, Gimli deals 1 damage to that creature's controller.",
    },
  ],
});
