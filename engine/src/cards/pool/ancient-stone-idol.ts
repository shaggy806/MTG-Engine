import { defineCard } from "../define.js";

// EDHREC rank 2520.
//
// Embercleave's reduction without the "you control": every attacking
// creature counts, whoever controls it (the ruling). Only generic mana comes
// off, and the whole {10} is generic.
//
// Rulings:
//   [2018-07-13] If there are enough attacking creatures, Ancient Stone Idol's cost can be reduced
//     to {0}.
//   [2018-07-13] Ancient Stone Idol's cost is reduced for each attacking creature, not just
//     creatures attacking you. It even counts your attacking creatures.

const DIES_TEXT = "When this creature dies, create a 6/12 colorless Construct artifact creature token with trample.";

export default defineCard({
  name: "Ancient Stone Idol",
  manaCost: "{10}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Golem"],
  power: 12,
  toughness: 12,
  keywords: ["flash", "trample"],
  text: `Flash\nThis spell costs {1} less to cast for each attacking creature.\nTrample\n${DIES_TEXT}`,
  selfCostReduction: {
    condition: { kind: "controls", filter: {}, atLeast: 0 },
    reduceGeneric: { countOf: { type: "creature", attacking: true } },
  },
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Construct Token (Ancient Stone Idol)", count: 1 },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});
