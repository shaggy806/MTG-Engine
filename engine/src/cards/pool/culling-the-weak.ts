import { defineCard } from "../define.js";

/** A sacrifice as an additional cost was already expressible — this card just
 * hadn't been authored. */
export default defineCard({
  name: "Culling the Weak",
  manaCost: "{B}",
  colors: ["B"],
  types: ["instant"],
  text: "As an additional cost to cast this spell, sacrifice a creature.\nAdd {B}{B}{B}{B}.",
  additionalCost: { sacrifice: { type: "creature", controlledBy: "you" } },
  effect: { kind: "add-mana", mana: "B", amount: 4 },
});
