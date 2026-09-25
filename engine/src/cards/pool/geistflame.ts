import { defineCard } from "../define.js";

export default defineCard({
  name: "Geistflame",
  manaCost: "{R}",
  colors: ["R"],
  types: ["instant"],
  flashback: { cost: "{3}{R}" },
  text: "Geistflame deals 1 damage to any target.\nFlashback {3}{R} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  targets: ["any-target"],
  effect: { kind: "damage", amount: 1, target: 0 },
});
