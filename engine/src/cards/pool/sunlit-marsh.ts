import { defineCard } from "../define.js";

export default defineCard({
  name: "Sunlit Marsh",
  colors: [],
  types: ["land"],
  subtypes: ["Plains", "Swamp"],
  text: "({T}: Add {W} or {B}.)\nThis land enters tapped.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["W", "B"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {W} or {B}.",
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
