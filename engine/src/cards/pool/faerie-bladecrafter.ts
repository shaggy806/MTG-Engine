import { defineCard } from "../define.js";

// EDHREC rank 6089.
//
// Rulings:
//   [2023-09-01] Use Faerie Bladecrafter's power from when it was last on the battlefield to
//     determine the value of X.
//   [2023-09-01] Normally, combat damage is dealt all at the same time. In that case, Faerie
//     Bladecrafter's first triggered ability triggers once for each player that Faeries you
//     control dealt combat damage to, regardless of how many creatures were dealing that damage.
//     If any of those Faeries have double strike or first strike, the ability will trigger once
//     for each player dealt damage in each combat damage step.

const DIES_TEXT =
  "When this creature dies, each opponent loses X life and you gain X life, where X is its power.";

export default defineCard({
  name: "Faerie Bladecrafter",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Faerie", "Rogue"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: `Flying\nWhenever one or more Faeries you control deal combat damage to a player, put a +1/+1 counter on this creature.\n${DIES_TEXT}`,
  triggered: [
    {
      // Once per player dealt damage in one combat damage step (the ruling).
      trigger: {
        on: "deals-damage-batch",
        who: "you-control",
        filter: { subtype: "Faerie" },
        combat: true,
      },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever one or more Faeries you control deal combat damage to a player, put a +1/+1 counter on this creature.",
    },
    {
      // X is its power as it last existed on the battlefield (Juri's shape).
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: { powerOf: "source" }, who: "each-opponent" },
          { kind: "gain-life", amount: { powerOf: "source" } },
        ],
      },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});
