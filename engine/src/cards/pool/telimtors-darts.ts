import { defineCard } from "../define.js";

export default defineCard({
  name: "Telim'Tor's Darts",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: "{2}, {T}: This artifact deals 1 damage to target player or planeswalker.",
  activated: [
    {
      cost: { mana: "{2}", tap: true },
      targets: ["player-or-planeswalker"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "{2}, {T}: This artifact deals 1 damage to target player or planeswalker.",
    },
  ],
});
