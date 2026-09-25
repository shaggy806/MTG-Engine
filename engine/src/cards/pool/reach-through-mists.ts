import { defineCard } from "../define.js";

export default defineCard({
  name: "Reach Through Mists",
  manaCost: "{U}",
  colors: ["U"],
  types: ["instant"],
  subtypes: ["Arcane"],
  text: "Draw a card.",
  effect: { kind: "draw", amount: 1 },
});
