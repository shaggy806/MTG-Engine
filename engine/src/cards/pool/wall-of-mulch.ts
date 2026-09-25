import { defineCard } from "../define.js";

export default defineCard({
  name: "Wall of Mulch",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Wall"],
  power: 0,
  toughness: 4,
  keywords: ["defender"],
  text: "Defender (This creature can't attack.)\n{G}, Sacrifice a Wall: Draw a card.",
  activated: [
    {
      cost: { mana: "{G}", tap: false, sacrifice: { filter: { subtype: "Wall" } } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{G}, Sacrifice a Wall: Draw a card.",
    },
  ],
});
