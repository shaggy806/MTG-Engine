import { defineCard } from "../define.js";

export default defineCard({
  name: "Bellowing Aegisaur",
  manaCost: "{5}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Dinosaur"],
  power: 3,
  toughness: 5,
  text: "Enrage — Whenever this creature is dealt damage, put a +1/+1 counter on each other creature you control.",
  triggered: [
    {
      trigger: { on: "dealt-damage", who: "self" },
      targets: [],
      effect: {
        kind: "add-counter-all",
        filter: { type: "creature", controlledBy: "you" },
        counter: "+1/+1",
        amount: 1,
        exceptSource: true,
      },
      resolve: null,
      text: "Enrage — Whenever this creature is dealt damage, put a +1/+1 counter on each other creature you control.",
    },
  ],
});
