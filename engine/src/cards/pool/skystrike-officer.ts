import { defineCard } from "../define.js";

export default defineCard({
  name: "Skystrike Officer",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 2,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\nWhenever this creature attacks, create a 1/1 colorless Soldier artifact creature token.\nTap three untapped Soldiers you control: Draw a card.",
  activated: [
    {
      cost: {
        mana: null,
        tap: false,
        tapOthers: { count: 3, filter: { subtype: "Soldier", controlledBy: "you" }, includeSelf: true },
      },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Tap three untapped Soldiers you control: Draw a card.",
    },
  ],
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Soldier Artifact Token", count: 1 },
      resolve: null,
      text: "Whenever this creature attacks, create a 1/1 colorless Soldier artifact creature token.",
    },
  ],
});
