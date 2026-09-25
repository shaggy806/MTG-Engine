import { defineCard } from "../define.js";

export default defineCard({
  name: "Siege Zombie",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 2,
  toughness: 2,
  text: "Tap three untapped creatures you control: Each opponent loses 1 life.",
  activated: [
    {
      cost: {
        mana: null,
        tap: false,
        tapOthers: { count: 3, filter: { type: "creature", controlledBy: "you" }, includeSelf: true },
      },
      targets: [],
      effect: { kind: "lose-life", amount: 1, who: "each-opponent" },
      resolve: null,
      text: "Tap three untapped creatures you control: Each opponent loses 1 life.",
    },
  ],
});
