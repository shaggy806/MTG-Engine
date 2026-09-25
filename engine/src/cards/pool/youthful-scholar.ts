import { defineCard } from "../define.js";

export default defineCard({
  name: "Youthful Scholar",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 2,
  toughness: 2,
  text: "When this creature dies, draw two cards.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 2 },
      resolve: null,
      text: "When this creature dies, draw two cards.",
    },
  ],
});
