import { defineCard } from "../define.js";

export default defineCard({
  name: "Selesnya Locket",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add {G} or {W}.\n{G/W}{G/W}{G/W}{G/W}, {T}, Sacrifice this artifact: Draw two cards.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["G", "W"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {G} or {W}.",
    },
    {
      cost: { mana: "{G/W}{G/W}{G/W}{G/W}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 2 },
      resolve: null,
      text: "{G/W}{G/W}{G/W}{G/W}, {T}, Sacrifice this artifact: Draw two cards.",
    },
  ],
});
