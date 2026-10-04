import { defineCard } from "../define.js";

// EDHREC rank 5504.

const SHRINES = { type: "enchantment", subtype: "Shrine", controlledBy: "you" } as const;
const TEXT = "At the beginning of your upkeep, you gain 2 life for each Shrine you control.";

// Honden of Infinite Rage's Shrine count, times two (Shamanic Revelation's `times`).
export default defineCard({
  name: "Honden of Cleansing Fire",
  manaCost: "{3}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["enchantment"],
  subtypes: ["Shrine"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: { kind: "gain-life", amount: { countOf: SHRINES, times: 2 } },
      resolve: null,
      text: TEXT,
    },
  ],
});
