import { defineCard } from "../define.js";

export default defineCard({
  name: "Consider",
  manaCost: "{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Surveil 1.\nDraw a card.",
  effect: { kind: "surveil", amount: 1, then: { kind: "draw", amount: 1 } },
});
