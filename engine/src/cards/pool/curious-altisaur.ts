import { defineCard } from "../define.js";

export default defineCard({
  name: "Curious Altisaur",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Dinosaur"],
  power: 2,
  toughness: 5,
  keywords: ["reach", "vigilance"],
  text: "Reach, vigilance\nWhenever a Dinosaur you control deals combat damage to a player, draw a card.",
  triggered: [
    {
      trigger: {
        on: "deals-combat-damage-to-player",
        who: "you-control",
        filter: { subtype: "Dinosaur" },
      },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Whenever a Dinosaur you control deals combat damage to a player, draw a card.",
    },
  ],
});
