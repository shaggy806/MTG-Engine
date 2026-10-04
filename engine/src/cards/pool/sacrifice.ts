import { defineCard } from "../define.js";

// EDHREC rank 2864.
//
// Rulings:
//   [2004-10-04] Sacrificing an animated land gives no mana since the converted mana cost was
//     zero.
//   [2013-04-15] You must sacrifice exactly one creature to cast this spell; you cannot cast it
//     without sacrificing a creature, and you cannot sacrifice additional creatures.
//   [2013-04-15] Players can only respond once this spell has been cast and all its costs have
//     been paid. No one can try to destroy the creature you sacrificed to prevent you from casting
//     this spell.

export default defineCard({
  name: "Sacrifice",
  manaCost: "{B}",
  colors: ["B"],
  types: ["instant"],
  text: "As an additional cost to cast this spell, sacrifice a creature.\nAdd an amount of {B} equal to the sacrificed creature's mana value.",
  additionalCost: { sacrifice: { type: "creature", controlledBy: "you" } },
  effect: { kind: "add-mana", mana: "B", amount: { manaValueOf: "sacrificed" } },
});
