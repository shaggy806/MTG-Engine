import { defineCard } from "../define.js";

export default defineCard({
  name: "Obelisk of Jund",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add {B}, {R}, or {G}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["B", "R", "G"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {B}, {R}, or {G}.",
    },
  ],
});
