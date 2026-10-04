import { defineCard } from "../define.js";

// EDHREC rank 4647.

export default defineCard({
  name: "Goblin War Strike",
  manaCost: "{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Goblin War Strike deals damage to target player or planeswalker equal to the number of Goblins you control.",
  targets: ["player-or-planeswalker"],
  effect: { kind: "damage", amount: { countOf: { subtype: "Goblin", controlledBy: "you" } }, target: 0 },
});
