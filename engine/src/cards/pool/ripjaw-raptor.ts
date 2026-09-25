import { defineCard } from "../define.js";

export default defineCard({
  name: "Ripjaw Raptor",
  manaCost: "{2}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Dinosaur"],
  power: 4,
  toughness: 5,
  text: "Enrage — Whenever this creature is dealt damage, draw a card.",
  triggered: [
    {
      trigger: { on: "dealt-damage", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Enrage — Whenever this creature is dealt damage, draw a card.",
    },
  ],
});
