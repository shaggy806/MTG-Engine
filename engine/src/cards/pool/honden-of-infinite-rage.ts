import { defineCard } from "../define.js";

// EDHREC rank 5247.

const SHRINES = { type: "enchantment", subtype: "Shrine", controlledBy: "you" } as const;
const TEXT =
  "At the beginning of your upkeep, Honden of Infinite Rage deals damage to any target equal to the number of Shrines you control.";

export default defineCard({
  name: "Honden of Infinite Rage",
  manaCost: "{2}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["enchantment"],
  subtypes: ["Shrine"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: ["any-target"],
      effect: { kind: "damage", target: 0, amount: { countOf: SHRINES } },
      resolve: null,
      text: TEXT,
    },
  ],
});
