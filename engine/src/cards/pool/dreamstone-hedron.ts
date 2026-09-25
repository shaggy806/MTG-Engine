import { defineCard } from "../define.js";

export default defineCard({
  name: "Dreamstone Hedron",
  manaCost: "{6}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add {C}{C}{C}.\n{3}, {T}, Sacrifice this artifact: Draw three cards.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 3 },
      resolve: null,
      text: "{T}: Add {C}{C}{C}.",
    },
    {
      cost: { mana: "{3}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 3 },
      resolve: null,
      text: "{3}, {T}, Sacrifice this artifact: Draw three cards.",
    },
  ],
});
