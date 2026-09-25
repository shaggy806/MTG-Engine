import { defineCard } from "../define.js";

export default defineCard({
  name: "Quick Study",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Draw two cards.",
  effect: { kind: "draw", amount: 2 },
});
