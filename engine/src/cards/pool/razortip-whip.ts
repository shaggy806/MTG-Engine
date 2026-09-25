import { defineCard } from "../define.js";

export default defineCard({
  name: "Razortip Whip",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: "{1}, {T}: This artifact deals 1 damage to target opponent or planeswalker.",
  activated: [
    {
      cost: { mana: "{1}", tap: true },
      targets: ["opponent-or-planeswalker"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "{1}, {T}: This artifact deals 1 damage to target opponent or planeswalker.",
    },
  ],
});
