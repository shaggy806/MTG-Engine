import { defineCard } from "../define.js";

// EDHREC rank 5751.
// Makes Wolf → use "Wolf Token".
//
// Rulings:
//   [2021-11-19] If you control a creature that is both a Wolf and a Werewolf, it's only counted
//     once for Hollowhenge Overlord's triggered ability.
//
// The count is one `countOf` over an OR of subtypes, so a Wolf Werewolf counts
// once (the ruling); read as the ability resolves.

const UPKEEP_TEXT =
  "At the beginning of your upkeep, for each creature you control that's a Wolf or a Werewolf, create a 2/2 green Wolf creature token.";

export default defineCard({
  name: "Hollowhenge Overlord",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Wolf"],
  power: 4,
  toughness: 4,
  keywords: ["flash"],
  text: `Flash\n${UPKEEP_TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: {
        kind: "create-token",
        token: "Wolf Token",
        count: { countOf: { type: "creature", controlledBy: "you", subtypes: ["Wolf", "Werewolf"] } },
      },
      resolve: null,
      text: UPKEEP_TEXT,
    },
  ],
});
