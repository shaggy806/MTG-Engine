import { defineCard } from "../define.js";

export default defineCard({
  name: "Scorching Missile",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["sorcery"],
  flashback: { cost: "{9}{R}" },
  text: "Scorching Missile deals 4 damage to target player or planeswalker.\nFlashback {9}{R} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  targets: ["player-or-planeswalker"],
  effect: { kind: "damage", amount: 4, target: 0 },
});
