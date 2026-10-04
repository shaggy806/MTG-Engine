import { defineCard } from "../define.js";

// EDHREC rank 5631.
//
// Honden of Infinite Rage's count: the Shrines are counted as the trigger
// resolves, this one included.

const SHRINES = { type: "enchantment", subtype: "Shrine", controlledBy: "you" } as const;
const TEXT = "At the beginning of your upkeep, target opponent discards a card for each Shrine you control.";

export default defineCard({
  name: "Honden of Night's Reach",
  manaCost: "{3}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["enchantment"],
  subtypes: ["Shrine"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: ["opponent"],
      effect: { kind: "discard", target: 0, amount: { countOf: SHRINES } },
      resolve: null,
      text: TEXT,
    },
  ],
});
