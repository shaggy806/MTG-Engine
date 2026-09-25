import { defineCard } from "../define.js";

export default defineCard({
  name: "Remote Isle",
  colors: [],
  types: ["land"],
  cycling: { cost: "{2}" },
  text: "This land enters tapped.\n{T}: Add {U}.\nCycling {2} ({2}, Discard this card: Draw a card.)",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "U", amount: 1 },
      resolve: null,
      text: "{T}: Add {U}.",
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
