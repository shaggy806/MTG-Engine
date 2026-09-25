import { defineCard } from "../define.js";

export default defineCard({
  name: "Tigereye Cameo",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add {G} or {W}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["G", "W"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {G} or {W}.",
    },
  ],
});
