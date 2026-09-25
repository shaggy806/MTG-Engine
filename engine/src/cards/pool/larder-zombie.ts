import { defineCard } from "../define.js";

export default defineCard({
  name: "Larder Zombie",
  manaCost: "{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 1,
  toughness: 3,
  keywords: ["defender"],
  text: "Defender\nTap three untapped creatures you control: Surveil 1. (Look at the top card of your library. You may put that card into your graveyard.)",
  activated: [
    {
      cost: {
        mana: null,
        tap: false,
        tapOthers: { count: 3, filter: { type: "creature", controlledBy: "you" }, includeSelf: true },
      },
      targets: [],
      effect: { kind: "surveil", amount: 1 },
      resolve: null,
      text: "Tap three untapped creatures you control: Surveil 1.",
    },
  ],
});
