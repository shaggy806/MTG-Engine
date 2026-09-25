import { defineCard } from "../define.js";

export default defineCard({
  name: "Acolyte of Xathrid",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 0,
  toughness: 1,
  text: "{1}{B}, {T}: Target player loses 1 life.",
  activated: [
    {
      cost: { mana: "{1}{B}", tap: true },
      targets: ["player"],
      effect: { kind: "lose-life", amount: 1, target: 0 },
      resolve: null,
      text: "{1}{B}, {T}: Target player loses 1 life.",
    },
  ],
});
