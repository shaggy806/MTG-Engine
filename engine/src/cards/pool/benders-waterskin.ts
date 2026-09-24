import { defineCard } from "../define.js";

export default defineCard({
  name: "Bender's Waterskin",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "Untap this artifact during each other player's untap step.\n{T}: Add one mana of any color.",
  static: [
    {
      affects: { scope: "self" },
      untapsDuringOthersUntap: "self",
      text: "Untap this artifact during each other player's untap step.",
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{T}: Add one mana of any color.",
    },
  ],
});
