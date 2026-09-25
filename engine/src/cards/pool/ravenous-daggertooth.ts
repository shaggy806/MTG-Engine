import { defineCard } from "../define.js";

export default defineCard({
  name: "Ravenous Daggertooth",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Dinosaur"],
  power: 3,
  toughness: 2,
  text: "Enrage — Whenever this creature is dealt damage, you gain 2 life.",
  triggered: [
    {
      trigger: { on: "dealt-damage", who: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: 2 },
      resolve: null,
      text: "Enrage — Whenever this creature is dealt damage, you gain 2 life.",
    },
  ],
});
