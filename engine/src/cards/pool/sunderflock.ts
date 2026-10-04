import { defineCard } from "../define.js";

// EDHREC rank 6110.
//
// Rulings:
//   [2025-11-17] To determine Sunderflock's total cost, start with the mana cost (or an
//     alternative cost if another card's effect allows you to pay one instead), add any cost
//     increases, then apply any cost reductions. Sunderflock's mana value remains unchanged, no
//     matter what the total cost to cast it was.
//   [2025-11-17] Once you announce you're casting a spell, no player may take actions until the
//     spell has been paid for. Notably, opponents can't try to remove Elementals you control from
//     the battlefield at that time.
//   [2025-11-17] If an Elemental on the battlefield has {X} in its mana cost, X is 0 for the
//     purpose of determining its mana value.
//   [2025-11-17] Once you determine the cost to cast Sunderflock, you may activate mana abilities
//     to pay that cost. If the greatest mana value among Elementals you control changes while
//     activating mana abilities (probably because you sacrificed one or more Elementals), the cost
//     to cast Sunderflock remains what you previously determined.

const COST_TEXT =
  "This spell costs {X} less to cast, where X is the greatest mana value among Elementals you control.";
const ENTER_TEXT =
  "When this creature enters, if you cast it, return all non-Elemental creatures to their owners' hands.";

export default defineCard({
  name: "Sunderflock",
  manaCost: "{7}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 5,
  toughness: 5,
  keywords: ["flying"],
  text: `${COST_TEXT}\nFlying\n${ENTER_TEXT}`,
  // The Great Henge's shape, over mana value (printed cost, {X} as 0): only
  // generic mana comes off, so {U}{U} is always paid (rule 601.2f).
  selfCostReduction: {
    condition: { kind: "controls", filter: {}, atLeast: 0 },
    reduceGeneric: {
      aggregate: "max",
      of: "mana-value",
      filter: { subtype: "Elemental", controlledBy: "you" },
    },
  },
  triggered: [
    {
      // "If you cast it" — Transcendent Dragon's enters filter.
      trigger: { on: "enters-battlefield", who: "self", filter: { cast: true, castBy: "you" } },
      targets: [],
      effect: {
        kind: "return-to-hand-all",
        filter: { type: "creature", notSubtypes: ["Elemental"] },
      },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
});
