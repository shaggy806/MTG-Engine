import { defineCard } from "../define.js";

const DRAW_TEXT = "At the beginning of your end step, draw seven cards.";
const HAND_TEXT = "Each opponent's maximum hand size is reduced by seven.";

export default defineCard({
  name: "Jin-Gitaxias, Core Augur",
  manaCost: "{8}{U}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Praetor"],
  power: 5,
  toughness: 4,
  keywords: ["flash"],
  text: `Flash\n${DRAW_TEXT}\n${HAND_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      maxHandSize: { who: "opponents", adjust: -7 },
      text: HAND_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      effect: { kind: "draw", amount: 7 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
