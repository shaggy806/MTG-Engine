import { defineCard } from "../define.js";

export default defineCard({
  name: "Goblin Cannon",
  manaCost: "{4}",
  colors: [],
  types: ["artifact"],
  text: "{2}: This artifact deals 1 damage to any target. Sacrifice this artifact.",
  activated: [
    {
      cost: { mana: "{2}", tap: false },
      targets: ["any-target"],
      effect: {
        kind: "sequence",
        effects: [{ kind: "damage", amount: 1, target: 0 }, { kind: "sacrifice-source" }],
      },
      resolve: null,
      text: "{2}: This artifact deals 1 damage to any target. Sacrifice this artifact.",
    },
  ],
});
