import { defineCard } from "../define.js";

export default defineCard({
  name: "Corrupted Conviction",
  manaCost: "{B}",
  colors: ["B"],
  types: ["instant"],
  text: "As an additional cost to cast this spell, sacrifice a creature.\nDraw two cards.",
  additionalCost: { sacrifice: { type: "creature", controlledBy: "you" } },
  effect: { kind: "draw", amount: 2 },
});
