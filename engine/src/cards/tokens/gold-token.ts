import { defineCard } from "../define.js";

// Curse of Opulence's token: "Sacrifice this token: Add one mana of any
// color." — no {T}, unlike a Treasure.
export default defineCard({
  name: "Gold Token",
  art: "603fa82c-173d-4bbc-95e5-5a3d027679c4",
  types: ["artifact"],
  subtypes: ["Gold"],
  text: "Sacrifice this token: Add one mana of any color.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "Sacrifice this token: Add one mana of any color.",
    },
  ],
});
