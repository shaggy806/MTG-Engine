import { defineCard } from "../define.js";

export default defineCard({
  name: "Umbral Expanse",
  colors: [],
  types: ["land"],
  subtypes: ["Plains", "Swamp"],
  cycling: { cost: "{2}" },
  text: "({T}: Add {W} or {B}.)\nThis land enters tapped.\nCycling {2} ({2}, Discard this card: Draw a card.)",
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
