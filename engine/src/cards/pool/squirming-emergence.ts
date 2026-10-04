import { defineCard } from "../define.js";

// EDHREC rank 5501.
//
// Rulings:
//   [2023-11-10] The target nonland permanent card still counts toward the number of permanent
//     cards in your graveyard for the purposes of Squirming Emergence.
//   [2023-11-10] Some descend triggered abilities include intervening "if" clauses (i.e. "if you
//     have [four or eight] permanent cards in your graveyard" in the middle of the ability). Each
//     of these abilities checks your graveyard at the moment it would trigger to see if it does.
//     If you don't have the required number of permanent cards in your graveyard at that time, the
//     ability doesn't trigger at all. If it does trigger, it will check again as it tries to
//     resolve. If you don't have the required number of permanent cards in your graveyard at that
//     time, the ability won't resolve and none of its effects will happen.
//   [2023-11-10] Cards with the ability word "fathomless descent" have abilities that care how
//     many permanent cards are in your graveyard.
//   [2023-11-10] Like all spells that require targets, Squirming Emergence will check to make sure
//     its target is still legal as it tries to resolve. Use the number of permanent cards in your
//     graveyard at that time, even though it may be a different number than the number that were
//     there as you cast the spell. If the permanent card's mana value is greater than the number
//     of permanent cards in your graveyard at that time, Squirming Emergence won't resolve.

const PERMANENT_TYPES = ["artifact", "battle", "creature", "enchantment", "land", "planeswalker"] as const;
const NONLAND_PERMANENT_TYPES = ["artifact", "battle", "creature", "enchantment", "planeswalker"] as const;

// The count is read whenever the target is checked — as it's cast and again
// as it resolves (the last ruling) — and the target card itself counts (the
// first). The spell is on the stack meanwhile, so it never counts itself.
export default defineCard({
  name: "Squirming Emergence",
  manaCost: "{1}{B}{G}",
  colors: ["B", "G"],
  types: ["sorcery"],
  text: "Fathomless descent — Return to the battlefield target nonland permanent card in your graveyard with mana value less than or equal to the number of permanent cards in your graveyard.",
  targets: [
    {
      kind: "card-in-graveyard",
      whose: "you",
      filter: {
        typesAnyOf: NONLAND_PERMANENT_TYPES,
        manaValue: {
          op: "lte",
          n: { amount: { countInGraveyard: { typesAnyOf: PERMANENT_TYPES, ownedBy: "you" } } },
        },
      },
    },
  ],
  effect: { kind: "put-onto-battlefield", target: 0 },
});
