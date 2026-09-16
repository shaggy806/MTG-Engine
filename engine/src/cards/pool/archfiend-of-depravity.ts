import { defineCard } from "../define.js";

export default defineCard({
  name: "Archfiend of Depravity",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Demon"],
  power: 5,
  toughness: 4,
  keywords: ["flying"],
  text:
    "Flying\n" +
    "At the beginning of each opponent's end step, that player chooses up to two creatures they control, then sacrifices the rest.",
  triggered: [
    {
      // Once on each *opponent's* end step — not once per opponent — and
      // `active-player` is the "that player" the card then refers to.
      trigger: { on: "step-begins", step: "end", who: "opponent" },
      targets: [],
      effect: {
        kind: "sacrifice-all-but",
        who: "active-player",
        keep: 2,
        filter: { type: "creature" },
      },
      resolve: null,
      text: "At the beginning of each opponent's end step, that player chooses up to two creatures they control, then sacrifices the rest.",
    },
  ],
});
