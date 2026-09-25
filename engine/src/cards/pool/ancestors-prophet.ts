import { defineCard } from "../define.js";

export default defineCard({
  name: "Ancestor's Prophet",
  manaCost: "{4}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 1,
  toughness: 5,
  text: "Tap five untapped Clerics you control: You gain 10 life.",
  activated: [
    {
      cost: {
        mana: null,
        tap: false,
        tapOthers: { count: 5, filter: { subtype: "Cleric", controlledBy: "you" }, includeSelf: true },
      },
      targets: [],
      effect: { kind: "gain-life", amount: 10 },
      resolve: null,
      text: "Tap five untapped Clerics you control: You gain 10 life.",
    },
  ],
});
