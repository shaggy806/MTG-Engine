import { defineCard } from "../define.js";

export default defineCard({
  name: "Azami, Lady of Scrolls",
  manaCost: "{2}{U}{U}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 0,
  toughness: 2,
  text: "Tap an untapped Wizard you control: Draw a card.",
  activated: [
    {
      cost: {
        mana: null,
        tap: false,
        tapOthers: { count: 1, filter: { subtype: "Wizard", controlledBy: "you" }, includeSelf: true },
      },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Tap an untapped Wizard you control: Draw a card.",
    },
  ],
});
