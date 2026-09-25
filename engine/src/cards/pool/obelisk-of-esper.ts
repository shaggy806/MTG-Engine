import { defineCard } from "../define.js";

export default defineCard({
  name: "Obelisk of Esper",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add {W}, {U}, or {B}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["W", "U", "B"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {W}, {U}, or {B}.",
    },
  ],
});
