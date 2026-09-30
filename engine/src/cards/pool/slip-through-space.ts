import { defineCard } from "../define.js";

// Devoid: colorless despite its blue mana cost.
export default defineCard({
  name: "Slip Through Space",
  manaCost: "{U}",
  colors: [],
  types: ["sorcery"],
  text: "Devoid (This card has no color.)\nTarget creature can't be blocked this turn.\nDraw a card.",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "grant-keyword", target: 0, keyword: "unblockable", duration: "end-of-turn" },
      { kind: "draw", amount: 1 },
    ],
  },
});
