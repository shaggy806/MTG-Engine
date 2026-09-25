import { defineCard } from "../define.js";

export default defineCard({
  name: "Bloodstone Cameo",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add {B} or {R}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["B", "R"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {B} or {R}.",
    },
  ],
});
