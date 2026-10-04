import { defineCard } from "../define.js";

// EDHREC rank 3042.
//
// Rulings:
//   [2013-04-15] You must sacrifice exactly one creature to cast this spell; you cannot cast it
//     without sacrificing a creature, and you cannot sacrifice additional creatures.
//   [2013-04-15] Players can only respond once this spell has been cast and all its costs have
//     been paid. No one can try to destroy the creature you sacrificed to prevent you from casting
//     this spell.
//
// Culling the Weak's shape.

export default defineCard({
  name: "Infernal Plunge",
  manaCost: "{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "As an additional cost to cast this spell, sacrifice a creature.\nAdd {R}{R}{R}.",
  additionalCost: { sacrifice: { type: "creature", controlledBy: "you" } },
  effect: { kind: "add-mana", mana: "R", amount: 3 },
});
