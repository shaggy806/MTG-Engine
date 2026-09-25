import { defineCard } from "../define.js";

export default defineCard({
  name: "Woodland Chasm",
  colors: [],
  supertypes: ["snow"],
  types: ["land"],
  subtypes: ["Swamp", "Forest"],
  text: "({T}: Add {B} or {G}.)\nThis land enters tapped.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["B", "G"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {B} or {G}.",
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
