import { defineCard } from "../define.js";

export default defineCard({
  name: "Jace's Ingenuity",
  manaCost: "{3}{U}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Draw three cards.",
  effect: { kind: "draw", amount: 3 },
});
