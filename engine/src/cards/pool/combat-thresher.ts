import { defineCard } from "../define.js";

// Brothers' War. Prototype (rule 702.163 — an alternate cost/color/size the
// spell can be cast with, keeping its abilities and types) isn't modeled —
// only the base {7} printing is authored, faithfully (no invented Ward or
// Cycling; the real card has neither).
export default defineCard({
  name: "Combat Thresher",
  manaCost: "{7}",
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 3,
  toughness: 3,
  keywords: ["double-strike"],
  text: "Double strike\nWhen Combat Thresher enters the battlefield, draw a card.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "When Combat Thresher enters the battlefield, draw a card.",
    },
  ],
});
