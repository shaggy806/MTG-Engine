import { defineCard } from "../define.js";

export default defineCard({
  name: "Phyrexian Vivisector",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Human"],
  power: 2,
  toughness: 2,
  text: "Whenever a creature you control dies, scry 1. (Look at the top card of your library. You may put that card on the bottom.)",
  triggered: [
    {
      trigger: { on: "dies", who: "you-control", filter: { type: "creature" } },
      targets: [],
      effect: { kind: "scry", amount: 1 },
      resolve: null,
      text: "Whenever a creature you control dies, scry 1.",
    },
  ],
});
