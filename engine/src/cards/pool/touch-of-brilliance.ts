import { defineCard } from "../define.js";

export default defineCard({
  name: "Touch of Brilliance",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Draw two cards.",
  effect: { kind: "draw", amount: 2 },
});
