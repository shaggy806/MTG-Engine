import { defineCard } from "../define.js";

// EDHREC rank 6186.
// Flashback whose whole cost is a sacrifice: Dread Return's shape.

export default defineCard({
  name: "Lava Dart",
  manaCost: "{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Lava Dart deals 1 damage to any target.\nFlashback—Sacrifice a Mountain. (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  targets: ["any-target"],
  effect: { kind: "damage", amount: 1, target: 0 },
  flashback: { cost: "", sacrifice: { filter: { subtype: "Mountain" }, count: 1 } },
});
