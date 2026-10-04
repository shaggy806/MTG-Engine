import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

// EDHREC rank 2848.
// Makes Shapeshifter → use "Shapeshifter Token".
//
// Rulings:
//   [2025-11-17] Changeling is a characteristic-defining ability. It functions in all zones, not
//     only while a card that has it is on the battlefield.
//   [2025-11-17] If an effect causes a creature with changeling to lose all abilities, it will
//     remain all creature types, even though it will no longer have changeling. This is because
//     changeling applies before the effect that removes it.
//   [2025-11-17] The subtype Shapeshifter that appears on the type line is mostly there to
//     reinforce the flavor. A creature card with changeling is just as much a Kithkin, a Goblin, a
//     Merfolk, and a Brushwagg as it is a Shapeshifter.
//   [2025-11-17] If an effect causes a creature with changeling to become a new creature type, it
//     will be only that new creature type (unless the effect says "in addition" or similar). It
//     will still have changeling; the effect making it all creature types will simply be
//     overwritten.

export default defineCard({
  name: "Abundant Countryside",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{T}: Add one mana of any color. Spend this mana only to cast a creature spell.\n{6}, {T}: Create a 1/1 colorless Shapeshifter creature token with changeling. (It's every creature type.)",
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "any-color",
        amount: 1,
        spendOnly: {
          spell: { type: "creature" },
          text: "Spend this mana only to cast a creature spell.",
        },
      },
      resolve: null,
      text: "{T}: Add one mana of any color. Spend this mana only to cast a creature spell.",
    },
    {
      cost: { mana: "{6}", tap: true },
      targets: [],
      effect: { kind: "create-token", token: "Shapeshifter Token", count: 1 },
      resolve: null,
      text: "{6}, {T}: Create a 1/1 colorless Shapeshifter creature token with changeling.",
    },
  ],
});
