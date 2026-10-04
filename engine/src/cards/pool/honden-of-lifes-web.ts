import { defineCard } from "../define.js";

// EDHREC rank 5562.
// Makes Spirit → use "Spirit Token (Colorless)".
const SHRINES = { type: "enchantment", subtype: "Shrine", controlledBy: "you" } as const;
const TEXT =
  "At the beginning of your upkeep, create a 1/1 colorless Spirit creature token for each Shrine you control.";

export default defineCard({
  name: "Honden of Life's Web",
  manaCost: "{4}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["enchantment"],
  subtypes: ["Shrine"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: { kind: "create-token", token: "Spirit Token (Colorless)", count: { countOf: SHRINES } },
      resolve: null,
      text: TEXT,
    },
  ],
});
