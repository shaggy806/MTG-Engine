import { defineCard } from "../define.js";

export default defineCard({
  name: "Spawnbinder Mage",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Wizard", "Ally"],
  power: 2,
  toughness: 4,
  text: "Cohort — {T}, Tap an untapped Ally you control: Tap target creature.",
  activated: [
    {
      cost: {
        mana: null,
        tap: true,
        tapOthers: { count: 1, filter: { subtype: "Ally", controlledBy: "you" } },
      },
      targets: ["creature"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: "Cohort — {T}, Tap an untapped Ally you control: Tap target creature.",
    },
  ],
});
