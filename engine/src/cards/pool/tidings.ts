import { defineCard } from "../define.js";

export default defineCard({
  name: "Tidings",
  manaCost: "{3}{U}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Draw four cards.",
  effect: { kind: "draw", amount: 4 },
});
