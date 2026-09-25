import { defineCard } from "../define.js";

export default defineCard({
  name: "Ruthless Deathfang",
  manaCost: "{4}{U}{B}",
  colors: ["U", "B"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text: "Flying\nWhenever you sacrifice a creature, target opponent sacrifices a creature of their choice.",
  triggered: [
    {
      trigger: { on: "sacrifice", who: "you", filter: { type: "creature" } },
      targets: ["opponent"],
      effect: { kind: "sacrifice", who: "target", filter: { type: "creature" }, count: 1 },
      resolve: null,
      text: "Whenever you sacrifice a creature, target opponent sacrifices a creature of their choice.",
    },
  ],
});
