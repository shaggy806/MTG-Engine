import { defineCard } from "../define.js";

export default defineCard({
  name: "Drelnoch",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Yeti", "Mutant"],
  power: 3,
  toughness: 3,
  text: "Whenever this creature becomes blocked, you may draw two cards.",
  triggered: [
    {
      trigger: { on: "becomes-blocked", who: "self" },
      targets: [],
      effect: { kind: "may", prompt: "Draw two cards?", effect: { kind: "draw", amount: 2 } },
      resolve: null,
      text: "Whenever this creature becomes blocked, you may draw two cards.",
    },
  ],
});
