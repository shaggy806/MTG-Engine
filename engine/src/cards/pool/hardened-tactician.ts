import { defineCard } from "../define.js";

export default defineCard({
  name: "Hardened Tactician",
  manaCost: "{1}{W}{B}",
  colors: ["W", "B"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 2,
  toughness: 4,
  text: "{1}, Sacrifice a token: Draw a card.",
  activated: [
    {
      cost: { mana: "{1}", tap: false, sacrifice: { filter: { token: true } } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{1}, Sacrifice a token: Draw a card.",
    },
  ],
});
