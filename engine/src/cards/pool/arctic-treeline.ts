import { defineCard } from "../define.js";

export default defineCard({
  name: "Arctic Treeline",
  colors: [],
  supertypes: ["snow"],
  types: ["land"],
  subtypes: ["Forest", "Plains"],
  text: "({T}: Add {G} or {W}.)\nThis land enters tapped.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["G", "W"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {G} or {W}.",
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
