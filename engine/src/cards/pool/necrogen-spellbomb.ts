import { defineCard } from "../define.js";

export default defineCard({
  name: "Necrogen Spellbomb",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  text: "{B}, Sacrifice this artifact: Target player discards a card.\n{1}, Sacrifice this artifact: Draw a card.",
  activated: [
    {
      cost: { mana: "{B}", tap: false, sacrifice: "self" },
      targets: ["player"],
      effect: { kind: "discard", target: 0, amount: 1 },
      resolve: null,
      text: "{B}, Sacrifice this artifact: Target player discards a card.",
    },
    {
      cost: { mana: "{1}", tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{1}, Sacrifice this artifact: Draw a card.",
    },
  ],
});
