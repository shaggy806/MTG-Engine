import { defineCard } from "../define.js";

export default defineCard({
  name: "Inferno Jet",
  manaCost: "{5}{R}",
  colors: ["R"],
  types: ["sorcery"],
  cycling: { cost: "{2}" },
  text: "Inferno Jet deals 6 damage to target opponent or planeswalker.\nCycling {2} ({2}, Discard this card: Draw a card.)",
  targets: ["opponent-or-planeswalker"],
  effect: { kind: "damage", amount: 6, target: 0 },
});
