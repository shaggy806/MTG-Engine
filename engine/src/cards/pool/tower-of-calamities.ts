import { defineCard } from "../define.js";

export default defineCard({
  name: "Tower of Calamities",
  manaCost: "{4}",
  colors: [],
  types: ["artifact"],
  text: "{8}, {T}: This artifact deals 12 damage to target creature.",
  activated: [
    {
      cost: { mana: "{8}", tap: true },
      targets: ["creature"],
      effect: { kind: "damage", amount: 12, target: 0 },
      resolve: null,
      text: "{8}, {T}: This artifact deals 12 damage to target creature.",
    },
  ],
});
