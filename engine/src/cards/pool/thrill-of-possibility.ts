import { defineCard } from "../define.js";

export default defineCard({
  name: "Thrill of Possibility",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "As an additional cost to cast this spell, discard a card.\nDraw two cards.",
  additionalCost: { discard: 1 },
  effect: { kind: "draw", amount: 2 },
});
