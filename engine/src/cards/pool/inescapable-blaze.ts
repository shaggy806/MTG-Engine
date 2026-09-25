import { defineCard } from "../define.js";

export default defineCard({
  name: "Inescapable Blaze",
  manaCost: "{4}{R}{R}",
  colors: ["R"],
  types: ["instant"],
  cantBeCountered: true,
  text: "This spell can't be countered.\nInescapable Blaze deals 6 damage to any target.",
  targets: ["any-target"],
  effect: { kind: "damage", amount: 6, target: 0 },
});
