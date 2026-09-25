import { defineCard } from "../define.js";

export default defineCard({
  name: "Composite Golem",
  manaCost: "{6}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Golem"],
  power: 4,
  toughness: 4,
  text: "Sacrifice this creature: Add {W}{U}{B}{R}{G}.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "add-mana", mana: { all: ["W", "U", "B", "R", "G"] }, amount: 1 },
      resolve: null,
      text: "Sacrifice this creature: Add {W}{U}{B}{R}{G}.",
    },
  ],
});
