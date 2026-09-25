import { defineCard } from "../define.js";

export default defineCard({
  name: "Volatile Fjord",
  colors: [],
  supertypes: ["snow"],
  types: ["land"],
  subtypes: ["Island", "Mountain"],
  text: "({T}: Add {U} or {R}.)\nThis land enters tapped.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["U", "R"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {U} or {R}.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
});
