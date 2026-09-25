import { defineCard } from "../define.js";

export default defineCard({
  name: "Phyrexian Altar",
  manaCost: "{3}",
  types: ["artifact"],
  text: "Sacrifice a creature: Add one mana of any color.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "creature-you-control" },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "Sacrifice a creature: Add one mana of any color.",
    },
  ],
});
