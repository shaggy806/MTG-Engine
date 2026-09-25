import { defineCard } from "../define.js";

export default defineCard({
  name: "Darigaaz's Attendant",
  manaCost: "{5}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Golem"],
  power: 3,
  toughness: 3,
  text: "{1}, Sacrifice this creature: Add {B}{R}{G}.",
  activated: [
    {
      cost: { mana: "{1}", tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "add-mana", mana: { all: ["B", "R", "G"] }, amount: 1 },
      resolve: null,
      text: "{1}, Sacrifice this creature: Add {B}{R}{G}.",
    },
  ],
});
