import { defineCard } from "../define.js";

export default defineCard({
  name: "Drowner of Secrets",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Merfolk", "Wizard"],
  power: 1,
  toughness: 3,
  text: "Tap an untapped Merfolk you control: Target player mills a card.",
  activated: [
    {
      cost: {
        mana: null,
        tap: false,
        tapOthers: { count: 1, filter: { subtype: "Merfolk", controlledBy: "you" }, includeSelf: true },
      },
      targets: ["player"],
      effect: { kind: "mill", target: 0, amount: 1 },
      resolve: null,
      text: "Tap an untapped Merfolk you control: Target player mills a card.",
    },
  ],
});
