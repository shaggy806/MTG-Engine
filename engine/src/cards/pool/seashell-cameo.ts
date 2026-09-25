import { defineCard } from "../define.js";

export default defineCard({
  name: "Seashell Cameo",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add {W} or {U}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["W", "U"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {W} or {U}.",
    },
  ],
});
