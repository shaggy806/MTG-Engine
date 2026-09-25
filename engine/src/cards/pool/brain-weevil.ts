import { defineCard } from "../define.js";

export default defineCard({
  name: "Brain Weevil",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Insect"],
  power: 1,
  toughness: 1,
  keywords: ["intimidate"],
  text: "Intimidate (This creature can't be blocked except by artifact creatures and/or creatures that share a color with it.)\nSacrifice this creature: Target player discards two cards. Activate only as a sorcery.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: ["player"],
      effect: { kind: "discard", target: 0, amount: 2 },
      resolve: null,
      text: "Sacrifice this creature: Target player discards two cards. Activate only as a sorcery.",
      sorcerySpeed: true,
    },
  ],
});
