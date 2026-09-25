import { defineCard } from "../define.js";

export default defineCard({
  name: "Burning Oil",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["instant"],
  flashback: { cost: "{3}{W}" },
  text: "Burning Oil deals 3 damage to target attacking or blocking creature.\nFlashback {3}{W} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  targets: ["attacking-or-blocking-creature"],
  effect: { kind: "damage", amount: 3, target: 0 },
});
