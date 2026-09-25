import { defineCard } from "../define.js";

export default defineCard({
  name: "Destructive Force",
  manaCost: "{5}{R}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Each player sacrifices five lands of their choice. Destructive Force deals 5 damage to each creature.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "sacrifice", who: "each-player", filter: { type: "land" }, count: 5 },
      { kind: "damage-all", amount: 5, filter: { type: "creature" } },
    ],
  },
});
