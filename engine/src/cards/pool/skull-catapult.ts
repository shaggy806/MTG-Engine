import { defineCard } from "../define.js";

export default defineCard({
  name: "Skull Catapult",
  manaCost: "{4}",
  colors: [],
  types: ["artifact"],
  text: "{1}, {T}, Sacrifice a creature: This artifact deals 2 damage to any target.",
  activated: [
    {
      cost: { mana: "{1}", tap: true, sacrifice: "creature-you-control" },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 2, target: 0 },
      resolve: null,
      text: "{1}, {T}, Sacrifice a creature: This artifact deals 2 damage to any target.",
    },
  ],
});
