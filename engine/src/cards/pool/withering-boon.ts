import { defineCard } from "../define.js";

// EDHREC rank 5133.
//
// Rulings:
//   [2005-11-01] The payment of 3 life is an additional cost of casting the spell.
//   [2008-04-01] A “creature spell” is any spell with the type Creature, even if it has other
//     types such as Artifact or Enchantment. Older cards of type Summon are also Creature spells.

export default defineCard({
  name: "Withering Boon",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "As an additional cost to cast this spell, pay 3 life.\nCounter target creature spell.",
  additionalCost: { payLife: 3 },
  targets: ["creature-spell"],
  effect: { kind: "counter", target: 0 },
});
