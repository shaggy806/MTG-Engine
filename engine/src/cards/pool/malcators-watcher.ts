import { defineCard } from "../define.js";

export default defineCard({
  name: "Malcator's Watcher",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["artifact", "creature"],
  subtypes: ["Phyrexian", "Drone"],
  power: 1,
  toughness: 1,
  keywords: ["flying", "vigilance"],
  text: "Flying, vigilance\nWhen this creature dies, draw a card.",
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
