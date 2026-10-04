import { defineCard } from "../define.js";

// EDHREC rank 2513.
//
// Rulings:
//   [2025-06-06] Bugenhagen's second ability checks at the moment it would trigger to see if you
//     control a creature with power 7 or greater. If you don't, the ability won't trigger at all.
//     If it does trigger, the ability will check again as it tries to resolve. If you don't
//     control a creature with power 7 or greater at that time, the ability won't resolve and none
//     of its effects will happen.

const UPKEEP_TEXT =
  "At the beginning of your upkeep, if you control a creature with power 7 or greater, draw a card.";

export default defineCard({
  name: "Bugenhagen, Wise Elder",
  manaCost: "{1}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Shaman"],
  power: 1,
  toughness: 3,
  keywords: ["reach"],
  text: `Reach\n${UPKEEP_TEXT}\n{T}: Add one mana of any color.`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{T}: Add one mana of any color.",
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      condition: { kind: "controls", filter: { type: "creature", power: { op: "gte", n: 7 } }, atLeast: 1 },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: UPKEEP_TEXT,
    },
  ],
});
