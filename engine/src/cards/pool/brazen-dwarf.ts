import { defineCard } from "../define.js";

// EDHREC rank 6197. Once per roll, however many dice it took.
const TEXT = "Whenever you roll one or more dice, this creature deals 1 damage to each opponent.";

export default defineCard({
  name: "Brazen Dwarf",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dwarf", "Shaman"],
  power: 1,
  toughness: 3,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "rolls-dice", who: "you" },
      targets: [],
      effect: { kind: "damage", amount: 1, who: "each-opponent" },
      resolve: null,
      text: TEXT,
    },
  ],
});
