import { defineCard } from "../define.js";

export default defineCard({
  name: "Catalyst Elemental",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 2,
  toughness: 2,
  text: "Sacrifice this creature: Add {R}{R}.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "add-mana", mana: "R", amount: 2 },
      resolve: null,
      text: "Sacrifice this creature: Add {R}{R}.",
    },
  ],
});
