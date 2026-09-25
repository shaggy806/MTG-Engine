import { defineCard } from "../define.js";

export default defineCard({
  name: "Concentrate",
  manaCost: "{2}{U}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Draw three cards.",
  effect: { kind: "draw", amount: 3 },
});
