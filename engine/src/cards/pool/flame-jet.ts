import { defineCard } from "../define.js";

export default defineCard({
  name: "Flame Jet",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["sorcery"],
  cycling: { cost: "{2}" },
  text: "Flame Jet deals 3 damage to target player or planeswalker.\nCycling {2} ({2}, Discard this card: Draw a card.)",
  targets: ["player-or-planeswalker"],
  effect: { kind: "damage", amount: 3, target: 0 },
});
