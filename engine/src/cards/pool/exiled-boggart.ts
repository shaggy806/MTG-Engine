import { defineCard } from "../define.js";

export default defineCard({
  name: "Exiled Boggart",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Goblin", "Rogue"],
  power: 2,
  toughness: 2,
  text: "When this creature dies, discard a card.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "discard", target: "you", amount: 1 },
      resolve: null,
      text: "When this creature dies, discard a card.",
    },
  ],
});
