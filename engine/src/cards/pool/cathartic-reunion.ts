import { defineCard } from "../define.js";

export default defineCard({
  name: "Cathartic Reunion",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "As an additional cost to cast this spell, discard two cards.\nDraw three cards.",
  additionalCost: { discard: 2 },
  effect: { kind: "draw", amount: 3 },
});
