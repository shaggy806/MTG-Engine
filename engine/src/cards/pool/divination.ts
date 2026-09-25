import { defineCard } from "../define.js";

export default defineCard({
  name: "Divination",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Draw two cards.",
  effect: { kind: "draw", amount: 2 },
});
