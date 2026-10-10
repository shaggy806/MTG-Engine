import { defineCard } from "../define.js";

// EDHREC rank 4087. The Ring tempts you (rule 701.54).
export default defineCard({
  name: "Birthday Escape",
  manaCost: "{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Draw a card. The Ring tempts you.",
  targets: [],
  effect: { kind: "sequence", effects: [{ kind: "draw", amount: 1 }, { kind: "the-ring-tempts-you" }] },
});
