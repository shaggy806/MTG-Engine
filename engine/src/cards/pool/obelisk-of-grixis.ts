import { defineCard } from "../define.js";

export default defineCard({
  name: "Obelisk of Grixis",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add {U}, {B}, or {R}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["U", "B", "R"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {U}, {B}, or {R}.",
    },
  ],
});
