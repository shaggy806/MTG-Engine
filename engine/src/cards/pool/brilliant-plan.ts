import { defineCard } from "../define.js";

export default defineCard({
  name: "Brilliant Plan",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Draw three cards.",
  effect: { kind: "draw", amount: 3 },
});
