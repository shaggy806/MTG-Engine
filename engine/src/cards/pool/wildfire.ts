import { defineCard } from "../define.js";

export default defineCard({
  name: "Wildfire",
  manaCost: "{4}{R}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Each player sacrifices four lands of their choice. Wildfire deals 4 damage to each creature.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "sacrifice", who: "each-player", filter: { type: "land" }, count: 4 },
      { kind: "damage-all", amount: 4, filter: { type: "creature" } },
    ],
  },
});
