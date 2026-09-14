import { defineCard } from "../define.js";

export default defineCard({
  name: "Mind Stone",
  manaCost: "{2}",
  types: ["artifact"],
  text: "{T}: Add {C}.\n{1}, {T}, Sacrifice Mind Stone: Draw a card.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{1}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{1}, {T}, Sacrifice Mind Stone: Draw a card.",
    },
  ],
});
