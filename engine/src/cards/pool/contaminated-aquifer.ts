import { defineCard } from "../define.js";

export default defineCard({
  name: "Contaminated Aquifer",
  colors: [],
  types: ["land"],
  subtypes: ["Island", "Swamp"],
  text: "({T}: Add {U} or {B}.)\nThis land enters tapped.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["U", "B"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {U} or {B}.",
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
