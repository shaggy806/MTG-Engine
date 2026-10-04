import { defineCard } from "../define.js";

// EDHREC rank 2826.
//
// Rulings:
//   [2024-11-08] Any red instant or sorcery spell you spend the mana on will be copied, not just
//     one that requires targets.
//   [2024-11-08] If the copied spell is modal (that is, it says "Choose one –" or the like), the
//     copy will have the same mode or modes. You can't choose a different one.
//   [2024-11-08] The copy is created on the stack, so it's not "cast." Abilities that trigger when
//     a player casts a spell won't trigger.
//   [2024-11-08] You can't choose to pay any additional costs for the copy. However, effects based
//     on any additional costs that were paid for the original spell are copied as though those
//     same costs were paid for the copy too.
//   [2024-11-08] The copy will have the same targets as the spell it's copying unless you choose
//     new ones. You may change any number of the targets, including all of them or none of them.
//     The new targets must be legal.
//   [2024-11-08] A copy is created even if the spell cast with the red mana produced by
//     Pyromancer's Goggles has been countered or otherwise left the stack without resolving by the
//     time that ability resolves. The copy resolves before the original spell.
//   [2024-11-08] The delayed triggered ability will trigger whether Pyromancer's Goggles is still
//     on the battlefield or not.
//   [2024-11-08] If more than one red mana produced by a Pyromancer's Goggles is spent to cast a
//     single red instant or sorcery spell, the delayed triggered ability associated with each mana
//     spent will trigger. That many copies will be created. It doesn't matter if this red mana was
//     produced by one Pyromancer's Goggles or by multiple Pyromancer's Goggles.
//   [2024-11-08] The mana produced by Pyromancer's Goggles can be spent on anything, not just a
//     red instant or sorcery spell.
//   [2024-11-08] If the copied spell has an X whose value was determined as it was cast, the copy
//     has the same value of X.

const MANA_TEXT =
  "{T}: Add {R}. When that mana is spent to cast a red instant or sorcery spell, copy that spell and you may choose new targets for the copy.";

export default defineCard({
  name: "Pyromancer's Goggles",
  manaCost: "{5}",
  colors: [],
  supertypes: ["legendary"],
  types: ["artifact"],
  text: MANA_TEXT,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "R",
        amount: 1,
        whenSpent: {
          spell: { typesAnyOf: ["instant", "sorcery"], colors: ["R"] },
          effect: { kind: "copy-spell", target: "trigger-spell", newTargets: true },
          text: "When that mana is spent to cast a red instant or sorcery spell, copy that spell and you may choose new targets for the copy.",
        },
      },
      resolve: null,
      text: MANA_TEXT,
    },
  ],
});
