import { defineCard } from "../define.js";

export default defineCard({
  name: "Preordain",
  manaCost: "{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Scry 2, then draw a card.",
  effect: { kind: "scry", amount: 2, then: { kind: "draw", amount: 1 } },
});
