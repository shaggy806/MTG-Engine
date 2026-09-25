import { defineCard } from "../define.js";

export default defineCard({
  name: "Goblin Replica",
  manaCost: "{3}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Goblin"],
  power: 2,
  toughness: 2,
  text: "{3}{R}, Sacrifice this creature: Destroy target artifact.",
  activated: [
    {
      cost: { mana: "{3}{R}", tap: false, sacrifice: "self" },
      targets: ["artifact"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "{3}{R}, Sacrifice this creature: Destroy target artifact.",
    },
  ],
});
