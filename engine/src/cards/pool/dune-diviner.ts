import { defineCard } from "../define.js";

export default defineCard({
  name: "Dune Diviner",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Snake", "Cleric"],
  power: 2,
  toughness: 3,
  text: "{1}, Tap an untapped Desert you control: You gain 1 life.",
  activated: [
    {
      cost: {
        mana: "{1}",
        tap: false,
        tapOthers: { count: 1, filter: { subtype: "Desert", controlledBy: "you" }, includeSelf: true },
      },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: "{1}, Tap an untapped Desert you control: You gain 1 life.",
    },
  ],
});
