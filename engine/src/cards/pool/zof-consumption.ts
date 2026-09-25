import { defineCard } from "../define.js";

export default defineCard({
  name: "Zof Consumption",
  manaCost: "{4}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Each opponent loses 4 life and you gain 4 life.",
  effect: {
    kind: "sequence",
    effects: [{ kind: "lose-life", amount: 4, who: "each-opponent" }, { kind: "gain-life", amount: 4 }],
  },
  faces: ["Zof Consumption", "Zof Bloodbog"],
});
