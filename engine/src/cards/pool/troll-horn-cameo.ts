import { defineCard } from "../define.js";

export default defineCard({
  name: "Troll-Horn Cameo",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add {R} or {G}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["R", "G"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {R} or {G}.",
    },
  ],
});
