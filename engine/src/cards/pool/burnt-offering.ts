import { defineCard } from "../define.js";

// "X mana in any combination of {B} and/or {R}": the split is the player's,
// asked as the spell resolves; X is the sacrificed creature's mana value, as
// it last existed.
export default defineCard({
  name: "Burnt Offering",
  manaCost: "{B}",
  colors: ["B"],
  types: ["instant"],
  text:
    "As an additional cost to cast this spell, sacrifice a creature.\n" +
    "Add X mana in any combination of {B} and/or {R}, where X is the sacrificed creature's mana value.",
  additionalCost: { sacrifice: { type: "creature", controlledBy: "you" } },
  effect: { kind: "add-mana", mana: { oneOf: ["B", "R"] }, amount: { manaValueOf: "sacrificed" } },
});
