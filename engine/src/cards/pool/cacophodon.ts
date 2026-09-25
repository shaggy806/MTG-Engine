import { defineCard } from "../define.js";

export default defineCard({
  name: "Cacophodon",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Dinosaur"],
  power: 2,
  toughness: 5,
  text: "Enrage — Whenever this creature is dealt damage, untap target permanent.",
  triggered: [
    {
      trigger: { on: "dealt-damage", who: "self" },
      targets: ["permanent"],
      effect: { kind: "untap", target: 0 },
      resolve: null,
      text: "Enrage — Whenever this creature is dealt damage, untap target permanent.",
    },
  ],
});
