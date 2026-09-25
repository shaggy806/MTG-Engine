import { defineCard } from "../define.js";

export default defineCard({
  name: "Tangled Islet",
  colors: [],
  types: ["land"],
  subtypes: ["Forest", "Island"],
  text: "({T}: Add {G} or {U}.)\nThis land enters tapped.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["G", "U"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {G} or {U}.",
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
