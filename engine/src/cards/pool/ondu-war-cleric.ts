import { defineCard } from "../define.js";

export default defineCard({
  name: "Ondu War Cleric",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Cleric", "Ally"],
  power: 2,
  toughness: 2,
  text: "Cohort — {T}, Tap an untapped Ally you control: You gain 2 life.",
  activated: [
    {
      cost: {
        mana: null,
        tap: true,
        tapOthers: { count: 1, filter: { subtype: "Ally", controlledBy: "you" } },
      },
      targets: [],
      effect: { kind: "gain-life", amount: 2 },
      resolve: null,
      text: "Cohort — {T}, Tap an untapped Ally you control: You gain 2 life.",
    },
  ],
});
