import { defineCard } from "../define.js";

export default defineCard({
  name: "Fires of Undeath",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["instant"],
  flashback: { cost: "{5}{B}" },
  text: "Fires of Undeath deals 2 damage to any target.\nFlashback {5}{B} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  targets: ["any-target"],
  effect: { kind: "damage", amount: 2, target: 0 },
});
