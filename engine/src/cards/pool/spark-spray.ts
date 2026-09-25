import { defineCard } from "../define.js";

export default defineCard({
  name: "Spark Spray",
  manaCost: "{R}",
  colors: ["R"],
  types: ["instant"],
  cycling: { cost: "{R}" },
  text: "Spark Spray deals 1 damage to any target.\nCycling {R} ({R}, Discard this card: Draw a card.)",
  targets: ["any-target"],
  effect: { kind: "damage", amount: 1, target: 0 },
});
