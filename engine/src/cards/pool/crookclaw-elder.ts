import { defineCard } from "../define.js";

export default defineCard({
  name: "Crookclaw Elder",
  manaCost: "{5}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Bird", "Wizard"],
  power: 3,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\nTap two untapped Birds you control: Draw a card.\nTap two untapped Wizards you control: Target creature gains flying until end of turn.",
  activated: [
    {
      cost: {
        mana: null,
        tap: false,
        tapOthers: { count: 2, filter: { subtype: "Bird", controlledBy: "you" }, includeSelf: true },
      },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Tap two untapped Birds you control: Draw a card.",
    },
    {
      cost: {
        mana: null,
        tap: false,
        tapOthers: { count: 2, filter: { subtype: "Wizard", controlledBy: "you" }, includeSelf: true },
      },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "flying", duration: "end-of-turn" },
      resolve: null,
      text: "Tap two untapped Wizards you control: Target creature gains flying until end of turn.",
    },
  ],
});
