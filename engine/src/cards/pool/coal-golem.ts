import { defineCard } from "../define.js";

export default defineCard({
  name: "Coal Golem",
  manaCost: "{5}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Golem"],
  power: 3,
  toughness: 3,
  text: "{3}, Sacrifice this creature: Add {R}{R}{R}.",
  activated: [
    {
      cost: { mana: "{3}", tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "add-mana", mana: "R", amount: 3 },
      resolve: null,
      text: "{3}, Sacrifice this creature: Add {R}{R}{R}.",
    },
  ],
});
