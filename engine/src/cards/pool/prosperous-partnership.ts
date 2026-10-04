import { defineCard } from "../define.js";

// EDHREC rank 6373.
// Makes Treasure → "Treasure Token"; makes Citizen → "Citizen Token" (1/1 green and white).

export default defineCard({
  name: "Prosperous Partnership",
  manaCost: "{1}{R}{W}",
  colors: ["W", "R"],
  types: ["enchantment"],
  text: "When this enchantment enters, create two 1/1 green and white Citizen creature tokens.\nTap three untapped creatures you control: Create a Treasure token.",
  activated: [
    {
      cost: {
        mana: null,
        tap: false,
        tapOthers: { count: 3, filter: { type: "creature", controlledBy: "you" }, includeSelf: true },
      },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: "Tap three untapped creatures you control: Create a Treasure token.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Citizen Token", count: 2 },
      resolve: null,
      text: "When this enchantment enters, create two 1/1 green and white Citizen creature tokens.",
    },
  ],
});
