import { defineCard } from "../define.js";

export default defineCard({
  name: "Crosis's Attendant",
  manaCost: "{5}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Golem"],
  power: 3,
  toughness: 3,
  text: "{1}, Sacrifice this creature: Add {U}{B}{R}.",
  activated: [
    {
      cost: { mana: "{1}", tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "add-mana", mana: { all: ["U", "B", "R"] }, amount: 1 },
      resolve: null,
      text: "{1}, Sacrifice this creature: Add {U}{B}{R}.",
    },
  ],
});
