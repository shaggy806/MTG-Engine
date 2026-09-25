import { defineCard } from "../define.js";

export default defineCard({
  name: "Galecaster Colossus",
  manaCost: "{5}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Giant", "Wizard"],
  power: 5,
  toughness: 6,
  text: "Tap an untapped Wizard you control: Return target nonland permanent you don't control to its owner's hand.",
  activated: [
    {
      cost: {
        mana: null,
        tap: false,
        tapOthers: { count: 1, filter: { subtype: "Wizard", controlledBy: "you" }, includeSelf: true },
      },
      targets: ["nonland-permanent-an-opponent-controls"],
      effect: { kind: "return-to-hand", target: 0 },
      resolve: null,
      text: "Tap an untapped Wizard you control: Return target nonland permanent you don't control to its owner's hand.",
    },
  ],
});
