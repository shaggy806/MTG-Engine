import { defineCard } from "../define.js";

export default defineCard({
  name: "Maraleaf Pixie",
  manaCost: "{G}{U}",
  colors: ["U", "G"],
  types: ["creature"],
  subtypes: ["Faerie"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\n{T}: Add {G} or {U}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["G", "U"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {G} or {U}.",
    },
  ],
});
