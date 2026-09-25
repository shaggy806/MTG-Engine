import { defineCard } from "../define.js";

export default defineCard({
  name: "Obelisk of Bant",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add {G}, {W}, or {U}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["G", "W", "U"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {G}, {W}, or {U}.",
    },
  ],
});
