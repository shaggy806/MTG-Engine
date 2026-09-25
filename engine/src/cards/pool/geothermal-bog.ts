import { defineCard } from "../define.js";

export default defineCard({
  name: "Geothermal Bog",
  colors: [],
  types: ["land"],
  subtypes: ["Swamp", "Mountain"],
  text: "({T}: Add {B} or {R}.)\nThis land enters tapped.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["B", "R"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {B} or {R}.",
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
