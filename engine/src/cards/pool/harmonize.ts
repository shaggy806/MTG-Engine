import { defineCard } from "../define.js";

export default defineCard({
  name: "Harmonize",
  manaCost: "{2}{G}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Draw three cards.",
  effect: { kind: "draw", amount: 3 },
});
