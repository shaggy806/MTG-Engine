import { defineCard } from "../define.js";

export default defineCard({
  name: "Spurred Wolverine",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Wolverine", "Beast"],
  power: 3,
  toughness: 2,
  text: "Tap two untapped Beasts you control: Target creature gains first strike until end of turn.",
  activated: [
    {
      cost: {
        mana: null,
        tap: false,
        tapOthers: { count: 2, filter: { subtype: "Beast", controlledBy: "you" }, includeSelf: true },
      },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "first-strike", duration: "end-of-turn" },
      resolve: null,
      text: "Tap two untapped Beasts you control: Target creature gains first strike until end of turn.",
    },
  ],
});
