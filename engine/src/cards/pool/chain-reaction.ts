import { defineCard } from "../define.js";

export default defineCard({
  name: "Chain Reaction",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text:
    "Chain Reaction deals X damage to each creature, where X is the number of " +
    "creatures on the battlefield.",
  effect: {
    kind: "damage-all",
    filter: { type: "creature" },
    amount: { countOf: { type: "creature" } },
  },
});
