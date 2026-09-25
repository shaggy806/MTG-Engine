import { defineCard } from "../define.js";

export default defineCard({
  name: "Summit Sentinel",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Elemental", "Soldier"],
  power: 1,
  toughness: 3,
  text: "When this creature dies, draw a card.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "When this creature dies, draw a card.",
    },
  ],
});
