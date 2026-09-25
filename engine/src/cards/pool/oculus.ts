import { defineCard } from "../define.js";

export default defineCard({
  name: "Oculus",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Homunculus"],
  power: 1,
  toughness: 1,
  text: "When this creature dies, you may draw a card.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "may", prompt: "Draw a card?", effect: { kind: "draw", amount: 1 } },
      resolve: null,
      text: "When this creature dies, you may draw a card.",
    },
  ],
});
