import { defineCard } from "../define.js";

export default defineCard({
  name: "Weave Fate",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Draw two cards.",
  effect: { kind: "draw", amount: 2 },
});
