import { defineCard } from "../define.js";

export default defineCard({
  name: "Leatherhead, Iron Gator",
  manaCost: "{5}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Crocodile", "Mutant", "Rogue"],
  power: 5,
  toughness: 5,
  keywords: ["trample", "haste"],
  text: "Trample, haste\nWhenever Leatherhead attacks, put two +1/+1 counters on each creature you control.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "add-counter-all",
        filter: { type: "creature", controlledBy: "you" },
        counter: "+1/+1",
        amount: 2,
      },
      resolve: null,
      text: "Whenever Leatherhead attacks, put two +1/+1 counters on each creature you control.",
    },
  ],
});
