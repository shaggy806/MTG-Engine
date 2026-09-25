import { defineCard } from "../define.js";

export default defineCard({
  name: "Serum Visions",
  manaCost: "{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Draw a card. Scry 2.",
  effect: { kind: "sequence", effects: [{ kind: "draw", amount: 1 }, { kind: "scry", amount: 2 }] },
});
