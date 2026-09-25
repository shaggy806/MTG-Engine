import { defineCard } from "../define.js";

export default defineCard({
  name: "Kami of Twisted Reflection",
  manaCost: "{1}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 2,
  toughness: 2,
  text: "Sacrifice this creature: Return target creature you control to its owner's hand.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: ["creature-you-control"],
      effect: { kind: "return-to-hand", target: 0 },
      resolve: null,
      text: "Sacrifice this creature: Return target creature you control to its owner's hand.",
    },
  ],
});
