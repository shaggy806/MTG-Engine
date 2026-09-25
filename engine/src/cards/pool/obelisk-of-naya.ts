import { defineCard } from "../define.js";

export default defineCard({
  name: "Obelisk of Naya",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add {R}, {G}, or {W}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["R", "G", "W"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {R}, {G}, or {W}.",
    },
  ],
});
