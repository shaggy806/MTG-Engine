import { defineCard } from "../define.js";

export default defineCard({
  name: "Fodder Cannon",
  manaCost: "{4}",
  colors: [],
  types: ["artifact"],
  text: "{4}, {T}, Sacrifice a creature: This artifact deals 4 damage to target creature.",
  activated: [
    {
      cost: { mana: "{4}", tap: true, sacrifice: "creature-you-control" },
      targets: ["creature"],
      effect: { kind: "damage", amount: 4, target: 0 },
      resolve: null,
      text: "{4}, {T}, Sacrifice a creature: This artifact deals 4 damage to target creature.",
    },
  ],
});
