import { defineCard } from "../define.js";

export default defineCard({
  name: "Glacial Floodplain",
  colors: [],
  supertypes: ["snow"],
  types: ["land"],
  subtypes: ["Plains", "Island"],
  text: "({T}: Add {W} or {U}.)\nThis land enters tapped.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["W", "U"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {W} or {U}.",
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
