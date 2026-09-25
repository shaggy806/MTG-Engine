import { defineCard } from "../define.js";

export default defineCard({
  name: "Drake-Skull Cameo",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add {U} or {B}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["U", "B"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {U} or {B}.",
    },
  ],
});
